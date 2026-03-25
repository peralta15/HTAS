export interface MedicalProfile {
    bloodType: string;
    chronicConditions: string[];
    allergies: string[];
    medications: string[];
    lastBloodPressure?: string;
    emergencyContact: string;
}

export interface User {
    id: string;
    fullName: string;
    email: string;
    role: 'PACIENTE' | 'CUIDADOR' | 'ADMIN';
    roleText?: string;        // ← Opcional
    isActive: boolean;
    hasCaregiver?: boolean;
    device?: string;
    medicalProfile?: MedicalProfile;
}