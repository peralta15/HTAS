import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

export type AlertSeverity = 'normal' | 'advertencia' | 'critica';
export type AlertStatus = 'activa' | 'resuelta' | 'ignorada';

export interface AlertItem {
  id: string;
  tipo?: string;
  severidad: AlertSeverity;
  estado: AlertStatus;
  timestamp: string; // ISO 8601
  mensaje?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AlertsService {
  private readonly base = '/api/v1/alerts';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las alertas recientes (máximo `limit`).
   * Endpoint: GET /api/v1/alerts?limit=10
   */
  getRecent(limit = 10): Observable<AlertItem[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http
      .get<AlertItem[]>(this.base, { params, withCredentials: true })
      .pipe(
        retry(1),
        map((res) => Array.isArray(res) ? res : []),
        catchError(this.handleError)
      );
  }

  /**
   * Centralized error handling for network / server errors.
   * Returns a sanitized Error observable so callers get a generic message.
   */
  private handleError(error: HttpErrorResponse) {
    // Avoid exposing internals or sensitive data to the UI; preserve original error for server-side logging.
    const generic = new Error('No se pudieron obtener las alertas. Intente nuevamente más tarde.');
    return throwError(() => generic);
  }
}
