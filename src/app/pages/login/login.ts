import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/superbase/supabase';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  show = false;
  toggleShow() {
this.show = !this.show;
const input: any = document.querySelector('input[formcontrolname="password"]');
if (input) input.type = this.show ? 'text' : 'password';
}


loginForm!: FormGroup;

loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async login() {
    this.errorMessage = '';
    this.loading = true;

    const { email, password } = this.loginForm.value;
    const { data, error } = await this.supabase.signIn(email, password);

    this.loading = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    // Login successful: navigate to dashboard
    this.router.navigate(['/dash']);
  }
}
