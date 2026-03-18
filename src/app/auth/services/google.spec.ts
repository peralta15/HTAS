import { TestBed } from '@angular/core/testing';

import { Google } from './google';

describe('Google', () => {
  let service: Google;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Google);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
