import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private _session$ = new BehaviorSubject<Session | null>(null);
  public readonly session$ = this._session$.asObservable();

  constructor() {
    this.supabase = createClient(
      'https://ysvawawllysojiojfesn.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdmF3YXdsbHlzb2ppb2pmZXNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjU0MzIsImV4cCI6MjA3OTI0MTQzMn0.9HYgdL1E0N3NH5lf0xZ7H-Ys0ZrbNFb5Ej9q6kf045E',
      {
        auth: {
          persistSession: true, // allow session restoration after page reload
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );

    // Load any existing session on service init
    this.initializeSession();

    // Listen for auth state changes and update subject
    this.supabase.auth.onAuthStateChange((event, session) => {
      this._session$.next(session);
      if (event === 'SIGNED_OUT') {
        // clear any manual storage if used later
        localStorage.removeItem('supabaseSession');
      } else if (session) {
        // lightweight manual backup (optional)
        localStorage.setItem('supabaseSession', JSON.stringify(session));
      }
    });
  }

  private async initializeSession() {
    try {
      const { data } = await this.supabase.auth.getSession();
      if (data.session) {
        this._session$.next(data.session);
        return;
      }
      // Fallback: manually restore from localStorage if Supabase didn't
      const raw = localStorage.getItem('supabaseSession');
      if (raw) {
        try {
          const parsed: Session = JSON.parse(raw);
          // setSession expects access_token + refresh_token
          await this.supabase.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
          });
          const { data: refreshed } = await this.supabase.auth.getSession();
          this._session$.next(refreshed.session ?? null);
        } catch (e) {
          localStorage.removeItem('supabaseSession');
        }
      }
    } catch (err) {
      console.warn('Failed to initialize session', err);
    }
  }

  // LOGIN
  async signIn(email: string, password: string) {
    const result = await this.supabase.auth.signInWithPassword({ email, password });
    if (result.data.session) {
      this._session$.next(result.data.session);
      localStorage.setItem('supabaseSession', JSON.stringify(result.data.session));
    }
    return result;
  }

  // CHECK SESSION
  async getSession() {
    // return cached first to avoid extra async cost
    const current = this._session$.getValue();
    if (current) return current;
    const { data } = await this.supabase.auth.getSession();
    this._session$.next(data.session);
    return data.session;
  }

  async getUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user ?? null;
  }

  // LOG OUT
  async signOut() {
    const res = await this.supabase.auth.signOut();
    this._session$.next(null);
    localStorage.removeItem('supabaseSession');
    return res;
  }

  // GET CLIENT
  get client(): SupabaseClient {
    return this.supabase;
  }
}
// Backwards-compat named export for tests expecting `Supabase`
export class Supabase extends SupabaseService {}
