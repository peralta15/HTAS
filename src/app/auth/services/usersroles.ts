import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UsuarioRoles {
  IdUsuarioRol?: number;
  IdUsuario?: number;
  NombreCompleto: string;
  Telefono: string;
  Correo: string;
  Contrasenia?: string;
  Rol: string;
  Activo: boolean;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class Usersroles {
  private apiURL = `${environment.baseUrl}/api/usersroles`;

  constructor(private http: HttpClient) { }

  getUsuarios(): Observable<UsuarioRoles[]> {
    return this.http.get<UsuarioRoles[]>(this.apiURL);
  }

  getUsuarioById(id: number): Observable<UsuarioRoles> {
    return this.http.get<UsuarioRoles>(`${this.apiURL}/${id}`);
  }

  createUsuario(usuario: Omit<UsuarioRoles, 'IdUsuarioRol'>): Observable<any> {
    return this.http.post(this.apiURL, usuario);
  }

  updateUsuario(id: number, usuario: Partial<UsuarioRoles>): Observable<any> {
    return this.http.put(`${this.apiURL}/${id}`, usuario);
  }

  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiURL}/${id}`);
  }
}