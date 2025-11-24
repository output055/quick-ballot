import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { SupabaseService } from '../../../../core/superbase/supabase';
import { Header } from "./header/header";



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Header],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard {
  userRole: string = '';

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    const session = await this.supabase.getSession();
    if (session) {
      // Assuming you store role in metadata
      this.userRole = session.user.user_metadata['role'];
    }
  }

}
