import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/superbase/supabase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-user.html',
  styleUrls: ['./create-user.scss'],
})
export class CreateUser {
  userForm: FormGroup;
  loading = false;
  errorMessage = '';
  // image preview data URL
  imagePreview: string | null = null;
  // raw selected file
  imageFile: File | null = null;
  imageError: string | null = null;

  constructor(private fb: FormBuilder, private supabase: SupabaseService, private router: Router) {
    this.userForm = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['voter', Validators.required],
      phone: ['', [Validators.pattern(/^\+?[0-9\s\-()]{7,20}$/)]],
      // profileImage is optional, validation happens in the file handler
      profileImage: [null],
    });
  }

  // Handler when user selects a profile image file
  async onProfileImageSelected(evt: Event) {
    this.imageError = null;
    const input = evt.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;

    const file = input.files[0];

    // Validate size (max 2MB)
    const MAX_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      this.imageError = 'File must be <= 2MB';
      this.imageFile = null;
      this.imagePreview = null;
      this.userForm.patchValue({ profileImage: null });
      return;
    }

    // Create a data URL to measure dimensions
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const MIN_DIM = 128;
        const MAX_DIM = 800;
        if (width < MIN_DIM || height < MIN_DIM) {
          this.imageError = `Image dimensions must be at least ${MIN_DIM}px`;
          this.imageFile = null;
          this.imagePreview = null;
          this.userForm.patchValue({ profileImage: null });
          return;
        }
        if (width > MAX_DIM || height > MAX_DIM) {
          this.imageError = `Image dimensions must be at most ${MAX_DIM}px`;
          this.imageFile = null;
          this.imagePreview = null;
          this.userForm.patchValue({ profileImage: null });
          return;
        }

        // Acceptable image
        this.imageFile = file;
        this.imagePreview = dataUrl;
        this.userForm.patchValue({ profileImage: file });
      };
      img.onerror = () => {
        this.imageError = 'Unable to read image';
        this.imageFile = null;
        this.imagePreview = null;
        this.userForm.patchValue({ profileImage: null });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  removeProfileImage() {
    this.imageFile = null;
    this.imagePreview = null;
    this.imageError = null;
    this.userForm.patchValue({ profileImage: null });
  }

  async createUser() {
    if (this.userForm.invalid) {
      alert('Please fill in all required fields correctly');
      return;
    }

    if (this.imageError) {
      alert('Please fix the profile image: ' + this.imageError);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { full_name, email, role } = this.userForm.value;

    try {
      console.log('Creating user with:', { full_name, email, role });

      // Generate a temporary password
      const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 12);

      // Call Edge Function to create user server-side (required)
      const fnBody: any = { full_name, email, role, password: tempPassword };
      if (this.imagePreview) {
        fnBody.avatarBase64 = this.imagePreview;
        if (this.imageFile) fnBody.avatarName = this.imageFile.name;
      }
      const phone = this.userForm.value.phone;
      if (phone) fnBody.phone = phone;

      console.log('Invoking Edge Function create-user...');

      // Create promise with 15 second timeout
      const invokePromise = this.supabase.client.functions.invoke('create-user', {
        body: fnBody,
      } as any);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Function call timed out after 15 seconds')), 15000)
      );

      let fnData: any = null;
      let fnError: any = null;

      try {
        const result = await Promise.race([invokePromise, timeoutPromise]);
        fnData = result.data;
        fnError = result.error;
      } catch (err: any) {
        console.error('Function invocation failed:', err);
        fnError = err;
      }

      if (fnError) {
        console.error('Edge function error:', fnError);
        const errorMsg = fnError.message || fnError.toString() || 'Edge Function unavailable';
        this.errorMessage = `Failed to create user: ${errorMsg}\n\nPossible causes:\n1. Edge Function 'create-user' is not deployed\n2. Function timed out (image too large?)\n3. Network/CORS issue\n\nDeploy with: supabase functions deploy create-user`;
        alert(this.errorMessage);
        this.loading = false;
        return;
      }

      const parsed: any = fnData as any;
      console.log('Edge Function response:', parsed);

      if (!parsed?.success || !parsed?.user?.id) {
        console.error('Edge function returned unexpected payload:', parsed);
        this.errorMessage = `Failed to create user: ${parsed?.error || 'Unexpected response from Edge Function'}\n\nResponse: ${JSON.stringify(parsed)}`;
        alert(this.errorMessage);
        this.loading = false;
        return;
      }

      // Success: user created on server
      const userId = parsed.user.id;
      const returnedTempPassword = parsed.user.tempPassword ?? tempPassword;
      const avatarUrl = parsed.user.avatar_url as string | null;

      alert('User created successfully!');
      alert(`User created!\nTemporary password: ${returnedTempPassword}`);
      this.userForm.reset();
      this.loading = false;
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error creating user:', error);
      this.errorMessage = 'An unexpected error occurred while creating the user';
      alert(this.errorMessage);
      this.loading = false;
    }
  }
}
