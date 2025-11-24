import { TestBed } from '@angular/core/testing';

import { SharedFunctions } from './shared-functions';

describe('SharedFunctions', () => {
  let service: SharedFunctions;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedFunctions);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
