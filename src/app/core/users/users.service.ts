import { Injectable } from '@angular/core';
import { SupabaseService } from '../../core/superbase/supabase';
import { Observable, from, map } from 'rxjs';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  access?: string[];
  lastActive?: string;
  dateAdded?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  // Fetch users from Supabase table `users`
  getUsers(): Observable<{ users: AppUser[]; error: string | null }> {
    return from(
      this.supabase.client
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.warn('Supabase users fetch error', error);
          return { users: [] as AppUser[], error: error.message };
        }
        const users = (data ?? []).map((u: any) => {
          const name = u.full_name || u.name || (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : '') || '';
          const email = u.email || u.user_email || '';
          const avatarUrl = u.avatar_url || u.avatar || u.avatarUrl;
          const access = Array.isArray(u.access)
            ? u.access
            : (u.role ? [u.role] : []);
          const lastActive = u.last_active || u.lastActive || u.updated_at || u.last_login_at;
          const dateAdded = u.created_at || u.dateAdded || u.inserted_at;
          return {
            id: String(u.id),
            name,
            email,
            avatarUrl,
            access,
            lastActive,
            dateAdded,
          } as AppUser;
        });
        return { users, error: null };
      })
    );
  }

  // Fetch a single user by id
  getUserById(id: string): Observable<{ user: AppUser | null; error: string | null }> {
    return from(
      this.supabase.client
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.warn('Supabase user fetch error', error);
          return { user: null, error: error.message };
        }
        const u: any = data ?? {};
        const name = u.full_name || u.name || (u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : '') || '';
        const email = u.email || u.user_email || '';
        const avatarUrl = u.avatar_url || u.avatar || u.avatarUrl;
        const access = Array.isArray(u.access)
          ? u.access
          : (u.role ? [u.role] : []);
        const lastActive = u.last_active || u.lastActive || u.updated_at || u.last_login_at;
        const dateAdded = u.created_at || u.dateAdded || u.inserted_at;
        const user: AppUser = {
          id: String(u.id),
          name,
          email,
          avatarUrl,
          access,
          lastActive,
          dateAdded,
        };
        return { user, error: null };
      })
    );
  }

  deleteUser(id: string): Observable<{ success: boolean; error: string | null }> {
    return from(
      this.supabase.client
        .from('users')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => ({ success: !error, error: error ? error.message : null }))
    );
  }

  updateUser(id: string, payload: { full_name?: string; role?: string; avatar_url?: string }): Observable<{ success: boolean; error: string | null }> {
    return from(
      this.supabase.client
        .from('users')
        .update(payload)
        .eq('id', id)
    ).pipe(
      map(({ error }) => ({ success: !error, error: error ? error.message : null }))
    );
  }
}
