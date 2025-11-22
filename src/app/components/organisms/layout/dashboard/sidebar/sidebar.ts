import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  standalone: true,
  imports: [CommonModule, RouterLink],
})
export class Sidebar {
  @Input() role: string = '';

  links: Record<string, { label: string; path: string }[]> = {
    'super-admin': [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Manage Elections', path: '/dashboard/elections' },
      { label: 'Manage Users', path: '/dashboard/users' },
      { label: 'Settings', path: '/dashboard/settings' },
    ],
    'admin': [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Manage Elections', path: '/dashboard/elections' },
      { label: 'Settings', path: '/dashboard/settings' },
    ],
    'voter': [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Vote Now', path: '/dashboard/vote' },
      { label: 'Results', path: '/dashboard/results' },
    ]
  };

  get roleLinks() {
    return this.links[this.role] || [];
  }
}
