import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { tap, catchError } from 'rxjs/operators';
import emailjs from '@emailjs/browser';
import { Observable, throwError } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Users {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private apiUrl = `${environment.authApi}`; // http://localhost:3000/api/auth

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  estaBloqueado = signal<boolean>(false);
  segundosRestantes = signal<number>(0);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      emailjs.init('RH7T2EvEV4pbSWkXQ');
    }
  }

  // REGISTRO
  registrar(datos: any) {
    return this.http.post(`${this.apiUrl}/register`, datos).pipe(
      tap((res: any) => {
        // Si el registro en Node.js es exitoso, enviamos el PIN por EmailJS
        // Usamos los datos que vienen del formulario (datos.nombre y datos.pin)
        this.enviarEmailPin(
          datos.correo,
          datos.nombre || 'Usuario',
          res.pin // El PIN que generó tu backend y devolvió en la respuesta
        );
      })
    );
  }

  // LOGIN
  login(credenciales: { correo: string, contrasenia: string }) {
    return this.http.post(`${this.apiUrl}/login`, credenciales).pipe(
      tap((res: any) => {
        this.currentUserSubject.next(res);
        // Guardamos en el navegador para que no se borre al refrescar (F5)
        localStorage.setItem('user_htas', JSON.stringify(res));
        // Si el login es exitoso pero no está verificado, reenviamos el PIN
        if (res.pinVerificado === false) {
          this.establecerSesion(res);
          this.enviarEmailPin(
            credenciales.correo,
            res.nombre || 'Usuario',
            res.pin
          );
        }
      }),
      catchError(err => {
        // Si al intentar loguear el backend dice que estamos bloqueados (423)
        if (err.status === 423) {
          this.activarContadorVisual(err.error.segundosRestantes);
        }
        return throwError(() => err);
      })
    );
  }

  establecerSesion(res: any) {
    const usuarioProcesado = {
      uid: res.uid,
      nombre: res.nombre,
      rol: res.rol,
      // Generamos la foto basada en el nombre de Postgres
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(res.nombre)}&background=b0001e&color=fff&bold=true`
    };

    this.currentUserSubject.next(usuarioProcesado);
    localStorage.setItem('user_htas', JSON.stringify(usuarioProcesado));
  }

  // Función para cargar sesión al abrir la página
  cargarSesionPersistente() {
    const saved = localStorage.getItem('user_htas');
    if (saved) {
      this.currentUserSubject.next(JSON.parse(saved));
    }
  }

  limpiarSesion() {
    localStorage.removeItem('user_htas');
    this.currentUserSubject.next(null);
  }

  // VERIFICAR PIN EN POSTGRESQL
  verificarPin(uid: string, pin: string) {
    return this.http.post(`${this.apiUrl}/verify-pin`, { uid, pin }).pipe(
      catchError(err => {
        if (err.status === 423) {
          this.activarContadorVisual(err.error.segundosRestantes);
        }
        return throwError(() => err);
      })
    );
  }

  // Lógica interna para el contador visual
  private activarContadorVisual(segundos: number) {
    this.estaBloqueado.set(true);
    this.segundosRestantes.set(segundos);

    const intervalo = setInterval(() => {
      this.segundosRestantes.update(s => s - 1);

      if (this.segundosRestantes() <= 0) {
        this.estaBloqueado.set(false);
        clearInterval(intervalo);
      }
    }, 1000);
  }

  // REENVIAR PIN (Solicitado manualmente)
  solicitarNuevoPin(uid: string) {
    // 1. Pedimos los datos actuales al servidor usando el UID
    return this.http.post(`${this.apiUrl}/request-new-pin`, { uid }).pipe(
      tap((res: any) => {
        // 2. Con la respuesta exitosa, enviamos el correo mediante EmailJS
        // res.correo, res.nombre y res.pin vienen de tu nueva función en el backend
        this.enviarEmailPin(res.correo, res.nombre, res.pin);
      })
    );
  }

  private async enviarEmailPin(email: string, nombre: string, pin: string) {
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + 25 * 60000);
    const horaFormateada = expiracion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // ESTOS NOMBRES DEBEN COINCIDIR CON TU PLANTILLA {{ }}
    const templateParams = {
      pin_seguridad: pin,      // <--- Antes quizás tenías otro nombre aquí
      fecha: horaFormateada,   // <--- Antes quizás tenías otro nombre aquí
      to_email: email,
      nombre_usuario: nombre
    };

    try {
      await emailjs.send('service_tqqxijq', 'template_a59hcr9', templateParams);
      console.log(`PIN (${pin}) enviado exitosamente a: ${email}`);
    } catch (error) {
      console.error('Error al enviar el PIN con EmailJS:', error);
    }
  }

  // --- GESTIÓN DE CITAS ---

  crearCita(datosCita: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/agendar-cita`, datosCita);
  }

  // Ahora filtramos por el correo del usuario logueado
  getMisCitas(email: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mis-citas/${email}`);
  }

  actualizarEstadoCita(idCita: number, datos: { estado: string, notasDoctor?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar-cita/${idCita}`, datos);
  }

  getUsuariosBackend(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all-users`);
  }

  updateUsuario(id: string | number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-user/${id}`, datos);
  }

  deleteUsuario(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-user/${id}`);
  }
}