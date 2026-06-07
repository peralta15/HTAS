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
  private apiUrl = `${environment.authApi}`;

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  estaBloqueado = signal<boolean>(false);
  segundosRestantes = signal<number>(0);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      emailjs.init('RH7T2EvEV4pbSWkXQ');
    }
  }

  // ==========================================================================
  // --- AUTENTICACIÓN Y USUARIOS ---
  // ==========================================================================
  registrar(datos: any) {
    return this.http.post(`${this.apiUrl}/register`, datos).pipe(
      tap((res: any) => {
        this.enviarEmailPin(
          datos.correo,
          datos.nombre || 'Usuario',
          res.pin
        );
      })
    );
  }

  login(credenciales: { correo: string, contrasenia: string }) {
    return this.http.post(`${this.apiUrl}/login`, credenciales).pipe(
      tap((res: any) => {
        this.currentUserSubject.next(res);
        localStorage.setItem('user_htas', JSON.stringify(res));
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
        if (err.status === 423) {
          this.activarContadorVisual(err.error.segundosRestantes);
        }
        return throwError(() => err);
      })
    );
  }

  establecerSesion(res: any) {
    const usuarioProcesado = {
      ...res,
      uid: res.uid || res.idusuario || res.id,
      nombre: res.nombre,
      rol: res.rol,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(res.nombre)}&background=b0001e&color=fff&bold=true`
    };
    this.currentUserSubject.next(usuarioProcesado);
    localStorage.setItem('user_htas', JSON.stringify(usuarioProcesado));
  }

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

  solicitarNuevoPin(uid: string) {
    return this.http.post(`${this.apiUrl}/request-new-pin`, { uid }).pipe(
      tap((res: any) => {
        this.enviarEmailPin(res.correo, res.nombre, res.pin);
      })
    );
  }

  private async enviarEmailPin(email: string, nombre: string, pin: string) {
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + 25 * 60000);
    const horaFormateada = expiracion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const templateParams = {
      pin_seguridad: pin,
      fecha: horaFormateada,
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

  // ==========================================================================
  // --- GESTIÓN DE CITAS ---
  // ==========================================================================
  crearCita(datosCita: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/agendar-cita`, datosCita);
  }

  getAllCitas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/todas-las-citas`);
  }

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

  // ==========================================================================
  // --- NOTIFICACIONES Y ROLES ---
  // ==========================================================================
  getRegistrosUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all-users`);
  }

  getAlertasMedicas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notificaciones-medico`);
  }

  getNotificacionesPaciente(email: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notificaciones-paciente/${email}`);
  }

  getNotificacionesAcompanante(idUsuario: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notificaciones-acompanante/${idUsuario}`);
  }

  // ==========================================================================
  // --- GESTIÓN DE TRATAMIENTOS ---
  // ==========================================================================
  getTratamientos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tratamientos`);
  }

  /**
   * Registra un tratamiento vinculando llaves foráneas requeridas por la BD de HTAS
   * @param datos Objeto con { idPaciente, idDoctor, idMedicamento, dosis, frecuenciaHoras, fechaInicio, fechaFin, notasInstrucciones }
   */
  crearTratamiento(datos: {
    idPaciente: number;
    idDoctor?: number | null;
    idMedicamento: number;
    dosis: string;
    frecuenciaHoras: number;
    fechaInicio: string;
    fechaFin: string;
    notasInstrucciones?: string;
    activo?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/tratamientos`, datos);
  }

  actualizarTratamiento(id: string | number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/tratamientos/${id}`, datos);
  }

  eliminarTratamiento(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tratamientos/${id}`);
  }

  // ==========================================================================
  // --- GESTIÓN DE MEDICAMENTOS ---
  // ==========================================================================
  getMedicamentos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/medicamentos`);
  }

  /**
   * Inserta un nuevo medicamento adaptado a las columnas de la tabla MEDICAMENTOS
   * @param datos Objeto con { nombreComercial, sustanciaActiva, presentacion, concentracion, laboratorio, indicacionesGenerales }
   */
  crearMedicamento(datos: {
    nombreComercial: string;
    sustanciaActiva?: string;
    presentacion: string;
    concentracion?: string;
    laboratorio?: string;
    indicacionesGenerales?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/medicamentos`, datos);
  }

  actualizarMedicamento(id: string | number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/medicamentos/${id}`, datos);
  }

  eliminarMedicamento(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/medicamentos/${id}`);
  }

  // ==========================================================================
  // --- GESTIÓN DE DISPOSITIVOS ---
  // ==========================================================================
  getDispositivos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dispositivos`);
  }

  /**
   * Vincula un dispositivo usando la dirección MAC única nativa
   * @param datos Objeto con { nombre, direccionMac, idPacienteAsociado }
   */
  crearDispositivo(datos: {
    nombre: string;
    direccionMac: string; // Formato MAC válido requerido por Postgres
    idPacienteAsociado?: number | null;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/dispositivos`, datos);
  }

  actualizarDispositivo(id: string | number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/dispositivos/${id}`, datos);
  }

  eliminarDispositivo(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/dispositivos/${id}`);
  }

  // ==========================================================================
  // --- GESTIÓN DE MEDICIONES DEL BAUMANÓMETRO (TENSÍMETRO FEMMTO) ---
  // ==========================================================================

  /**
   * Envía la lectura del baumanómetro al backend
   * @param datos Objeto con { idPaciente, sistolica, diastolica, pulso, metodoSincronizacion }
   */
  registrarMedicion(datos: {
    idPaciente: number;
    sistolica: number;
    diastolica: number;
    pulso: number;
    metodoSincronizacion?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/mediciones`, datos);
  }

  /**
   * Obtiene el historial completo de mediciones de un paciente
   * @param idPaciente El ID del usuario paciente
   */
  getMedicionesPaciente(idPaciente: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mediciones/paciente/${idPaciente}`);
  }

  /**
   * Obtiene la lectura más reciente del paciente (útil para el dashboard)
   * @param idPaciente El ID del usuario paciente
   */
  getUltimaMedicionPaciente(idPaciente: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mediciones/paciente/${idPaciente}/ultima`);
  }
}