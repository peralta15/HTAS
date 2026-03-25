import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, shareReplay, finalize } from 'rxjs';
import { TokenService } from '../core/services/token.service';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    nombre_completo: string;
    email: string;
    rol: 'PACIENTE' | 'CUIDADOR' | 'ADMIN';
  };
  session: {
    id: string;
    ip: string;
    userAgent: string;
    createdAt: string;
    suspicious: boolean;
  };
}

export interface ActiveSession {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  suspicious: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private refreshRequest$?: Observable<LoginResponse>;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  setToken(token: string): void {
    this.tokenService.setToken(token);
  }

  clearToken(): void {
    this.tokenService.clearToken();
  }

  getToken(): string | null {
    return this.tokenService.getToken();
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken() && !this.tokenService.isTokenExpired();
  }

  ensureAuthenticated(): Promise<boolean> {
    if (this.isAuthenticated()) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      this.refreshAccessToken().subscribe({
        next: () => resolve(true),
        error: () => {
          this.clearToken();
          resolve(false);
        }
      });
    });
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap((resp) => {
        this.tokenService.setToken(resp.token);
      })
    );
  }

  refreshAccessToken(): Observable<LoginResponse> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.refreshRequest$ = this.http.post<LoginResponse>(
      `${this.apiUrl}/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      tap((resp) => {
        this.tokenService.setToken(resp.token);
      }),
      finalize(() => {
        this.refreshRequest$ = undefined;
      }),
      shareReplay(1)
    );

    return this.refreshRequest$;
  }

  logout(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => this.tokenService.clearToken())
    );
  }

  getActiveSessions(): Observable<ActiveSession[]> {
    return this.http.get<ActiveSession[]>(`${this.apiUrl}/sessions`);
  }

  closeSession(sessionId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/sessions/${sessionId}/logout`, {});
  }

  closeAllSessions(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/sessions/logout-all`, {});
  }
}

