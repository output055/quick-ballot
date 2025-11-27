import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, map, switchMap, take } from 'rxjs';
import { UsersService, AppUser } from '../../core/users/users.service';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-edit.html',
  styleUrls: ['./user-edit.scss'],
})
export class UserEdit {
  vm$!: Observable<{ user: AppUser | null; error: string | null }>;
  form!: FormGroup;
  private userId = '';
  saving = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      role: [''],
      avatar_url: [''],
    });

    this.vm$ = this.route.paramMap.pipe(
      map(params => params.get('id') || ''),
      switchMap(id => {
        this.userId = id;
        return this.usersService.getUserById(id);
      })
    );

    this.vm$.pipe(take(1)).subscribe(({ user, error }) => {
      if (error) {
        this.error = error;
        return;
      }
      if (user) {
        this.form.patchValue({
          full_name: user.name,
          role: (user.access && user.access[0]) || '',
          avatar_url: user.avatarUrl || '',
        });
      }
    });
  }

  save() {
    if (!this.userId || this.form.invalid) return;
    this.saving = true;
    this.error = null;
    const { full_name, role, avatar_url } = this.form.value;
    this.usersService.updateUser(this.userId, { full_name, role, avatar_url })
      .pipe(take(1))
      .subscribe(res => {
        this.saving = false;
        if (res.error) {
          this.error = res.error;
          return;
        }
        this.router.navigate(['/dash','user-management', this.userId]);
      });
  }
}
