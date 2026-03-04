import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UserInfo {
  name: string;
  initials: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Usando la misma base URL que tu dashboard.service
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtener información del usuario actual
   * GET /api/user/profile
   */
  getUserInfo(): Observable<UserInfo> {
    // Llama a tu endpoint real
    return this.http.get<any>(`${this.apiUrl}/user/profile`).pipe(
      map(response => ({
        name: response.name || 'Usuario',
        initials: this.getInitials(response.name || 'Usuario'),
        email: response.email || '',
        role: response.role || 'Cuidador'
      }))
    );
  }

  /**
   * Obtener número de notificaciones no leídas
   * GET /api/notifications/count
   */
  getNotificationCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/notifications/count`);
  }

  /**
   * Generar iniciales desde el nombre
   */
  private getInitials(name: string): string {
    if (!name) return 'US';
    
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}