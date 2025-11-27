// Use a pinned minor version to reduce cold start variability
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

// Minimal declaration for Deno so local tooling doesn't error
declare const Deno: { env: { get(key: string): string | undefined } };

// Convert base64 → Uint8Array
function base64ToUint8Array(base64: string): { bytes: Uint8Array; mime: string | null } {
  const match = base64.match(/^data:([^;]+);base64,(.*)$/);
  const mime = match ? match[1] : null;
  const cleaned = match ? match[2] : base64;
  const binaryString = atob(cleaned);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return { bytes, mime };
}

// Basic CORS headers (adjust origin as needed)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "*",
};

export const handler = async (req: Request): Promise<Response> => {
  const start = Date.now();
  console.log(`[create-user] start request`);
  // Handle preflight CORS
  if (req.method === "OPTIONS") {
    console.log(`[create-user] OPTIONS preflight in ${Date.now() - start}ms`);
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.log(`[create-user] invalid method ${req.method}`);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const parseStart = Date.now();
    const { full_name, email, role, password, phone, avatarBase64, avatarName } = await req.json() as any;
    console.log(`[create-user] parsed body in ${Date.now() - parseStart}ms`);

    if (!full_name || !email || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: full_name, email, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const clientStart = Date.now();
    const supabase = createClient(supabaseUrl, serviceRole);
    console.log(`[create-user] created client in ${Date.now() - clientStart}ms`);

    // Temp password
    const tempPassword =
      password ||
      Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 12);

    // Create Auth user
    const authStart = Date.now();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { role },
    });
    console.log(`[create-user] auth admin createUser took ${Date.now() - authStart}ms`);

    if (authError) {
      return new Response(
        JSON.stringify({ error: "Failed to create auth user: " + authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData!.user.id;

    // ============================
    //  UPLOAD AVATAR
    // ============================
    let avatarPublicUrl: string | null = null;
    let uploadedFilePath: string | null = null;
    if (avatarBase64) {
      const avatarStart = Date.now();
      try {
        const { bytes, mime } = base64ToUint8Array(avatarBase64);
        const ext = (mime?.split("/")[1]) ?? (avatarName?.split(".").pop()) ?? "jpg";
        const filePath = `avatars/${userId}.${ext}`;
        uploadedFilePath = filePath;

        // Use upload with upsert for compatibility
        const uploadStart = Date.now();
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, bytes, { contentType: mime || "image/jpeg", upsert: true });
        console.log(`[create-user] avatar upload took ${Date.now() - uploadStart}ms`);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatarPublicUrl = (urlData as any).publicUrl;
      } catch (err) {
        console.error("Avatar upload failed:", err);
        // Rollback auth user
        await supabase.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ error: "Avatar upload failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`[create-user] total avatar processing took ${Date.now() - avatarStart}ms`);
    }

    // ============================
    //  INSERT DB USER
    // ============================
    const insertStart = Date.now();
    const { error: dbError } = await supabase.from("users").insert({
      id: userId,
      full_name,
      email,
      role,
      phone,
      avatar_url: avatarPublicUrl,
    });
    console.log(`[create-user] DB insert took ${Date.now() - insertStart}ms`);

    if (dbError) {
      // rollback everything
      await supabase.auth.admin.deleteUser(userId);
      if (uploadedFilePath) {
        await supabase.storage.from("avatars").remove([uploadedFilePath]);
      }
      return new Response(
        JSON.stringify({ error: "Failed to insert user record: " + dbError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================
    //  SUCCESS
    // ============================
    console.log(`[create-user] success total time ${Date.now() - start}ms`);
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          full_name,
          email,
          role,
          phone,
          tempPassword,
          avatar_url: avatarPublicUrl,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    console.log(`[create-user] failed total time ${Date.now() - start}ms`);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};
