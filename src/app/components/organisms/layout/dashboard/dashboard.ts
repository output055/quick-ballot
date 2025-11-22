import { Component, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';
import { SupabaseService } from '../../../../core/superbase/supabase';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  providers: [SupabaseService],
})
export class Dashboard {
  userRole: string = '';

  constructor(@Inject(SupabaseService) private supabase: SupabaseService) {}

  async ngOnInit() {
    const session = await this.supabase.getSession();
    if (session) {
      // Assuming you store role in metadata
      this.userRole = session.user.user_metadata['role'];
    }
  }

}
