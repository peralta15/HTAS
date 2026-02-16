import { TestBed } from '@angular/core/testing';

import { Usersroles } from './usersroles';

describe('Usersroles', () => {
  let service: Usersroles;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Usersroles);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
