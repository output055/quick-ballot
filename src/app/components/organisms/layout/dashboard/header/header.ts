import { SharedFunctions } from './../Shared/shared-functions';
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../../../core/superbase/supabase';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule,Sidebar],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header implements OnInit {
 role: string = '';

  menuOpen = false;
  userName = '';
  sidebar = false;
  header = false;

  constructor(private supabase: SupabaseService, public SharedFunctions: SharedFunctions) {}

  async ngOnInit() {

    // Fetch the current session, then load the user row from public.users
    const session = await this.supabase.getSession();
    if (session?.user) {
      try {
        const { data: userRow, error } = await this.supabase.client
          .from('users')
          .select('full_name, role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.warn('Could not load user from public.users, falling back to auth metadata', error);
          this.userName = session.user.user_metadata?.['full_name'] || session.user.email || 'User';
          this.role = session.user.user_metadata?.['role'] || '';
        } else {
          this.userName = userRow?.full_name || session.user.email || 'User';
          this.role = userRow?.role || session.user.user_metadata?.['role'] || '';
        }
      } catch (err) {
        console.error('Unexpected error loading user row:', err);
        this.userName = session.user.user_metadata?.['full_name'] || session.user.email || 'User';
        this.role = session.user.user_metadata?.['role'] || '';
      }
    }
  }

  

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleSidebar(){
    this.SharedFunctions.toggleSidebar();
  }
}
