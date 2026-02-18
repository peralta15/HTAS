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
  private readonly base = '/api/v1/caregiver/dashboard';

  constructor(private http: HttpClient) {}

  /**
   * GET /api/v1/caregiver/dashboard/{patientId}
   * Returns a strongly-typed dashboard payload for the caregiver view.
   */
  getDashboard(patientId: string): Observable<CaregiverDashboardResponse> {
    const url = `${this.base}/${encodeURIComponent(patientId)}`;
    return this.http
      .get<CaregiverDashboardResponse>(url, { withCredentials: true })
      .pipe(
        retry(1), // transient retry
        map((resp) => resp as CaregiverDashboardResponse),
        catchError(this.handleError)
      );
  }

  /**
   * Centralized error handling. Do not expose internal error payloads to callers.
   */
  private handleError(error: HttpErrorResponse) {
    // In production we return a generic message and preserve the original error for logging systems.
    // Avoid leaking sensitive information to the UI.
    const generic = new Error('No se pudo cargar el dashboard. Intente nuevamente más tarde.');
    return throwError(() => generic);
  }
}
