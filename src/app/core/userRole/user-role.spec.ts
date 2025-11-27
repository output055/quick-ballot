import { TestBed } from '@angular/core/testing';

import { UserRole } from './user-role';

describe('UserRole', () => {
  let service: UserRole;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserRole);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
