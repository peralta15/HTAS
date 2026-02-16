import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface User {
  idusuario: number;
  correo: string;
  contrasenia: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class Users {
  private apiURL = `${environment.baseUrl}/api/users`;

  constructor(private http: HttpClient) { }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiURL);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiURL}/${id}`);
  }

  createUser(user: Omit<User, 'idusuario'>): Observable<User> {
    return this.http.post<User>(this.apiURL, user);
  }

  updateUser(id: number, user: Omit<User, 'idusuario'>): Observable<User> {
    return this.http.put<User>(`${this.apiURL}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiURL}/${id}`);
  }
}