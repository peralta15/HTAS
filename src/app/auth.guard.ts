import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (_route, _state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureAuthenticated().then((ok) => {
    if (ok) return true;
    router.navigate(['/login']);
    return false;
  });
};

export const authChildGuard: CanActivateChildFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureAuthenticated().then((ok) => {
    if (ok) return true;
    router.navigate(['/login']);
    return false;
  });
};

