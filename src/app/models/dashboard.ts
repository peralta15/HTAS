 
/**
 * Strongly-typed models for the caregiver dashboard.
 * All timestamps use ISO 8601 strings.
 */

export interface PatientInfo {
	id: string;
	name: string;
	age?: number;
	dateOfBirth?: string | null; // ISO 8601 or null
	gender?: 'female' | 'male' | 'other' | 'unknown';
}

export interface BloodPressureReading {
	systolic: number;
	diastolic: number;
	timestamp: string; // ISO 8601
}

export interface Adherence {
	percent: number; // 0-100
	windowDays: number; // e.g. 7
	lastUpdated?: string; // ISO 8601
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'resolved' | 'ignored';

export interface Alert {
	id: string;
	type: string;
	severity: AlertSeverity;
	status: AlertStatus;
	timestamp: string; // ISO 8601
	code?: string;
	message?: string;
}

export interface ChartsData {
	bloodPressureTrend: Array<{ date: string; systolic: number; diastolic: number }>;
	adherenceTrend: Array<{ date: string; percent: number }>;
	measurementsFrequency?: Array<{ date: string; count: number }>;
}

export interface Dashboard {
	patient: PatientInfo;
	lastBloodPressure?: BloodPressureReading | null;
	adherence?: Adherence | null;
	alertsCount: number;
	nextAppointment?: string | null; // ISO 8601 or null
	chartsData?: ChartsData | null;
	alerts?: Alert[]; // optional full alert list if needed by UI
}
