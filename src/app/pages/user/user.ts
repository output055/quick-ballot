import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, map, switchMap, take } from 'rxjs';
import { UsersService, AppUser } from '../../core/users/users.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user.html',
  styleUrls: ['./user.scss'],
})
export class UserDetail {
  vm$!: Observable<{ user: AppUser | null; error: string | null }>;
  private userId = '';

  constructor(private route: ActivatedRoute, private router: Router, private usersService: UsersService) {}

  ngOnInit() {
    this.vm$ = this.route.paramMap.pipe(
      map(params => params.get('id') || ''),
      switchMap(id => {
        this.userId = id;
        return this.usersService.getUserById(id);
      })
    );
  }

  onDelete() {
    if (!this.userId) return;
    const ok = confirm('Delete this user? This cannot be undone.');
    if (!ok) return;
    this.usersService.deleteUser(this.userId).pipe(take(1)).subscribe(res => {
      if (res.error) {
        alert(`Failed to delete: ${res.error}`);
        return;
      }
      this.router.navigate(['/dash','user-management']);
    });
  }
}
