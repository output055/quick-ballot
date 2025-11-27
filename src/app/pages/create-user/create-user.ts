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
  userForm!: FormGroup;
  loading = false;
  errorMessage = '';

  imagePreview: string | null = null;
  imageFile: File | null = null;
  imageError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userForm = this.fb.group({
      full_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      role: ['voter', [Validators.required]],
      phone: [
        '',
        [
          Validators.pattern(/^\+?[0-9\s\-()]{7,20}$/)
        ]
      ]
    });
    console.log(this.userForm.value);
  }


  // THE IMAGE ASPECT
  selectedImage: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (!file) return;

    this.selectedImage = file;

    // Preview the image
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
    };
    reader.readAsDataURL(file);
  }

}
