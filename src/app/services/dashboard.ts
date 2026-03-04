import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

/** Strong types for the dashboard API response */
export interface BloodPressureReading {
  systolic: number;
  diastolic: number;
  timestamp?: string; // ISO 8601
}

export interface Vitals {
  bloodPressure?: {
    last?: BloodPressureReading;
    trend?: BloodPressureReading[]; // 30 days trend
  };
  adherence?: {
    last7DaysPercent?: number;
  };
  measurementsFrequency?: {
    daily?: number;
    weekly?: number;
  };
}

export type AlertStatus = 'active' | 'resolved' | 'ignored';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertItem {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  timestamp?: string; // ISO 8601
  status: AlertStatus;
  severity?: AlertSeverity;
  code?: string;
}

export interface Summary {
  adherencePercentage?: number; // 0-100
  nextAppointment?: string | null; // ISO 8601 or null
  name?: string;
  age?: number;
  lastSeen?: string;
}

export interface CaregiverDashboardResponse {
  patientId: string;
  patientName?: string;
  caregiverName?: string;
  vitals?: Vitals;
  alerts?: AlertItem[];
  summary?: Summary;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  // ✅ URL CORREGIDA - apunta a tu backend Express
  private readonly base = 'http://localhost:3000/api/dashboard';

  constructor(private http: HttpClient) {}

  /**
   * GET /api/dashboard/{patientId}
   * Returns a strongly-typed dashboard payload for the caregiver view.
   */
  getDashboard(patientId: string): Observable<CaregiverDashboardResponse> {
    const url = `${this.base}/${encodeURIComponent(patientId)}`;
    console.log('📡 Llamando a API:', url);
    
    return this.http
      .get<CaregiverDashboardResponse>(url)  // ✅ Sin withCredentials si no lo necesitas
      .pipe(
        retry(1),
        map((resp) => {
          console.log('✅ Respuesta recibida:', resp);
          return resp as CaregiverDashboardResponse;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Centralized error handling.
   */
  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en API:', error);
    
    let errorMessage = 'No se pudo cargar el dashboard. ';
    
    if (error.status === 0) {
      errorMessage += 'No se puede conectar al servidor. Asegúrate que el backend esté corriendo en http://localhost:3000';
    } else if (error.status === 404) {
      errorMessage += 'El recurso no fue encontrado.';
    } else if (error.status === 500) {
      errorMessage += 'Error interno del servidor.';
    } else {
      errorMessage += 'Intente nuevamente más tarde.';
    }
    
    const generic = new Error(errorMessage);
    return throwError(() => generic);
  }
}