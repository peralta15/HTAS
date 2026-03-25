import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((err) => {
      const status = err?.status;
      const url = String(req.url || '');

      const isRefresh = url.includes('/refresh');
      const isLogout = url.includes('/logout');

      if (status !== 401 || isRefresh || isLogout) {
        return throwError(() => err);
      }

      // Intentar refresh una sola vez para reintentar la petición original
      return auth.refreshAccessToken().pipe(
        switchMap(() => {
          const newToken = auth.getToken();
          if (!newToken) {
            throw err;
          }
          const retryReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`
            }
          });
          return next(retryReq);
        }),
        catchError((refreshErr) => {
          auth.logout().subscribe({
            error: () => {
              // ignorar
            }
          });
          auth.clearToken();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        })
      );
    })
  );
};

