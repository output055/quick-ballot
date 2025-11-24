import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from '../../../../../core/superbase/supabase';

export type UserRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class SharedFunctions {
  sidebar: boolean = false;

  // public observable for components to subscribe to
  private _currentUser = new BehaviorSubject<UserRow | null>(null);
  public readonly currentUser$: Observable<UserRow | null> = this._currentUser.asObservable();

  // simple in-memory cache with TTL
  private _cache: UserRow | null = null;
  private _lastFetchTs = 0;
  private readonly CACHE_TTL_MS = 60_000; // 60 seconds

  constructor(private supabaseService: SupabaseService) {}

  toggleSidebar() {
    this.sidebar = !this.sidebar;
  }

  /**
   * Returns the cached user row if available and fresh, otherwise fetches
   * from `public.users` and updates the observable cache.
   * Use `force=true` to bypass the cache.
   */
  async loadCurrentUser(force = false): Promise<UserRow | null> {
    try {
      const now = Date.now();
      if (!force && this._cache && now - this._lastFetchTs < this.CACHE_TTL_MS) {
        return this._cache;
      }

      const session = await this.supabaseService.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        this._cache = null;
        this._currentUser.next(null);
        return null;
      }

      const { data, error } = await this.supabaseService.client
        .from('users')
        .select('id, full_name, email, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('SharedFunctions: unable to load user row', error);
        
        // fallback to auth metadata if available
        const fallback = {
          id: userId,
          full_name: session.user.user_metadata?.['full_name'] || null,
          email: session.user.email || null,
          role: session.user.user_metadata?.['role'] || null,
        } as UserRow;
        this._cache = fallback;
        this._lastFetchTs = now;
        this._currentUser.next(fallback);
        return fallback;
      }

      this._cache = data as UserRow;
      this._lastFetchTs = now;
      this._currentUser.next(this._cache);
      return this._cache;
    } catch (err) {
      console.error('SharedFunctions: unexpected error getting user row', err);
      return null;
    }
  }

  /** Force refresh and return the up-to-date user row. */
  async refreshCurrentUser(): Promise<UserRow | null> {
    return this.loadCurrentUser(true);
  }

  /** Clear the cached user row and observable state. */
  clearCurrentUserCache() {
    this._cache = null;
    this._lastFetchTs = 0;
    this._currentUser.next(null);
  }

}
