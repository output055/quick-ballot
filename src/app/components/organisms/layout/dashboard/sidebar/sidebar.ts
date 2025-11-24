import { SupabaseService } from './../../../../../core/superbase/supabase';
import { SharedFunctions } from './../Shared/shared-functions';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Links } from './navLinks';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroUsers, heroHome } from '@ng-icons/heroicons/outline';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon, RouterLinkActive],
  viewProviders: [provideIcons({ heroUsers,heroHome })]
})
export class Sidebar implements OnInit, OnDestroy {
  private _sub: Subscription | null = null;

  constructor(public SharedFunctions: SharedFunctions, public supabase: SupabaseService) {}

  // role will be populated from SharedFunctions.currentUser$
  role: string = '';

  LINK = Links;

  // groups of links to render after filtering by role
  filteredLinks: Array<{ links: any[]; [k: string]: any }> = [];

  ngOnInit(): void {
    // attempt to load current user (will update observable)
    this.SharedFunctions.loadCurrentUser().catch((e) => console.warn('Failed to preload user', e));

    // subscribe to current user observable to keep role updated
    this._sub = this.SharedFunctions.currentUser$.subscribe((u) => {
      this.role = u?.role ?? '';
      this.filteredLinks = this.computeFilteredLinks(this.role);
    });
  }

  private computeFilteredLinks(role: string) {
    if (!role) return [];

    // Normalize LINK shape and support either `user` (string) or `roles` (string[])
    return this.LINK
      .map((group: any) => {
        const allowedGroup = (() => {
          if (group.user) {
            if (group.user === 'all') return true;
            return group.user === role;
          }
          if (group.roles && Array.isArray(group.roles)) {
            return group.roles.includes(role);
          }
          return false;
        })();

        if (!allowedGroup) return null;

        // Filter items inside the group by item-level roles if provided
        const links = (group.links || []).filter((item: any) => {
          if (!item) return false;
          if (!item.roles) return true;
          if (Array.isArray(item.roles)) return item.roles.includes(role);
          if (typeof item.roles === 'string') return item.roles === role;
          return false;
        });

        if (!links.length) return null;

        return { ...group, links };
      })
      .filter((g: any) => g !== null);
  }

  ngOnDestroy(): void {
    this._sub?.unsubscribe();
  }

  toggleSidebar(){
    this.SharedFunctions.toggleSidebar();
  }

}
