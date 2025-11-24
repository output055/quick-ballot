import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
// Provide a minimal declaration for Deno so local TypeScript tooling doesn't error.
// In the Supabase Edge runtime, Deno is available at runtime.
declare const Deno: {
  env: { get(key: string): string | undefined };
};

interface CreateUserRequest {
  full_name: string;
  email: string;
  role: string;
  password?: string;
  // optional base64 image data (data URL or raw base64)
  avatarBase64?: string;
  // optional suggested filename (e.g., avatar.png)
  avatarName?: string;
}

function base64ToUint8Array(base64: string): { bytes: Uint8Array; mime?: string } {
  // remove data URL prefix if present
  const match = base64.match(/^data:([^;]+);base64,(.*)$/);
  let cleaned = base64;
  let mime: string | undefined;
  if (match) {
    mime = match[1];
    cleaned = match[2];
  }

  const binaryString = atob(cleaned);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return { bytes, mime };
}

// Basic CORS headers. Adjust origin for stricter policies if needed.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "*",
};

export const handler = async (req: Request): Promise<Response> => {
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as CreateUserRequest;
    const { full_name, email, role, password, avatarBase64, avatarName } = body;

    if (!full_name || !email || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: full_name, email, role" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const tempPassword =
      password ||
      Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 12);

    // Create auth user with service role
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authUser.user.id;

    // If an avatarBase64 was provided, upload it to storage using service role
    let avatarPublicUrl: string | null = null;
    let uploadedPath: string | null = null;
    if (avatarBase64) {
      try {
        const { bytes, mime } = base64ToUint8Array(avatarBase64);
        // determine extension
        let ext = "jpg";
        if (mime) {
          const part = mime.split("/");
          if (part[1]) ext = part[1];
        } else if (avatarName) {
          const parts = avatarName.split('.');
          if (parts.length > 1) ext = parts.pop() as string;
        }

        const filePath = `avatars/${userId}.${ext}`;
        uploadedPath = filePath;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, bytes, { contentType: mime || 'application/octet-stream', upsert: true });

        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
          // proceed without avatar; don't abort user creation solely for avatar upload
        } else {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          avatarPublicUrl = (urlData as any)?.publicUrl ?? null;
        }
      } catch (e) {
        console.error('Failed to process avatarBase64:', e);
      }
    }

    // Prepare insert payload (include avatar_url if uploaded)
    const insertPayload: any = {
      id: userId,
      full_name,
      email,
      role,
    };
    if (avatarPublicUrl) insertPayload.avatar_url = avatarPublicUrl;

    const { error: dbError } = await supabase.from('users').insert(insertPayload);

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up: delete the auth user and any uploaded avatar
      await supabase.auth.admin.deleteUser(userId);
      if (uploadedPath) {
        try {
          await supabase.storage.from('avatars').remove([uploadedPath]);
        } catch (e) {
          console.warn('Failed to remove uploaded avatar during cleanup', e);
        }
      }
      return new Response(
        JSON.stringify({ error: `Failed to insert user record: ${dbError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email,
          full_name,
          role,
          tempPassword,
          avatar_url: avatarPublicUrl,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};
