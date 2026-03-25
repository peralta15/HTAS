import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateUserRequest {
    nombre_completo: string;
    email: string;
    password: string;
    telefono?: string;
    rol: 'PACIENTE' | 'CUIDADOR' | 'ADMIN';
    activo?: boolean;
    perfil_medico?: any;
}

export interface CreateUserResponse {
    success: boolean;
    message: string;
    data: {
        usuario_id: number;
    };
}

export interface ApiUser {
    id: number;
    nombre_completo: string;
    email: string;
    rol: 'PACIENTE' | 'CUIDADOR' | 'ADMIN';
    activo: boolean;
    tiene_cuidador: boolean;
    tiene_dispositivo: boolean;
}

export interface UpdateUserRequest {
    nombre_completo?: string;
    email?: string;
    telefono?: string;
    rol?: 'PACIENTE' | 'CUIDADOR' | 'ADMIN';
    activo?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {  // ← Aquí debe ser UserService
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) {}

    getUsers(): Observable<ApiUser[]> {
        return this.http.get<ApiUser[]>(`${this.apiUrl}/users`);
    }

    getRoles(): Observable<string[]> {
        return this.http.get<string[]>(`${this.apiUrl}/roles`);
    }

    createUser(userData: CreateUserRequest): Observable<CreateUserResponse> {
        return this.http.post<CreateUserResponse>(`${this.apiUrl}/users`, userData);
    }

    updateUser(id: number | string, data: UpdateUserRequest): Observable<{ success: boolean; message?: string }> {
        return this.http.put<{ success: boolean; message?: string }>(`${this.apiUrl}/users/${id}`, data);
    }

    deleteUser(id: number | string): Observable<{ success: boolean; message?: string }> {
        return this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/users/${id}`);
    }
}