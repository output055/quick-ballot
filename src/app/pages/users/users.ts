import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';
import { UsersService, AppUser } from '../../core/users/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './users.html',
  styleUrls: ['./users.scss'],
})
export class Users {
  users$!: Observable<{ users: AppUser[]; error: string | null }>;
  vm$!: Observable<{ users: AppUser[]; error: string | null }>;
  selectAll = false;
  readonly searchTerm$ = new BehaviorSubject<string>('');

  constructor(private usersService: UsersService) {}

  ngOnInit() {
    this.users$ = this.usersService.getUsers();
    this.vm$ = combineLatest([this.users$, this.searchTerm$]).pipe(
      map(([resp, term]) => {
        const t = (term || '').toLowerCase();
        const users = !t
          ? resp.users
          : resp.users.filter(u =>
              (u.name || '').toLowerCase().includes(t) ||
              (u.email || '').toLowerCase().includes(t)
            );
        return { users, error: resp.error };
      })
    );
  }

  toggleSelectAll() {
    this.selectAll = !this.selectAll;
  }

}
