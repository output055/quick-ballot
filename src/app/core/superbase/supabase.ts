import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://ysvawawllysojiojfesn.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdmF3YXdsbHlzb2ppb2pmZXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjU0MzIsImV4cCI6MjA3OTI0MTQzMn0.9HYgdL1E0N3NH5lf0xZ7H-Ys0ZrbNFb5Ej9q6kf045E'
    );
  }

  // LOGIN
  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  // CHECK SESSION
  async getSession() {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  // LOG OUT
  async signOut() {
    return this.supabase.auth.signOut();
  }
}
