import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { tap } from 'rxjs/operators';
import emailjs from '@emailjs/browser';

@Injectable({ providedIn: 'root' })
export class Users {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private apiUrl = `${environment.authApi}`; // http://localhost:3000/api/auth

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
        // Si el login es exitoso pero no está verificado, reenviamos el PIN
        if (res.pinVerificado === false) {
          this.enviarEmailPin(
            credenciales.correo,
            res.nombre || 'Usuario',
            res.pin
          );
        }
      })
    );
  }

  // VERIFICAR PIN EN POSTGRESQL
  verificarPin(uid: string, pin: string) {
    return this.http.post(`${this.apiUrl}/verify-pin`, { uid, pin });
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
      await emailjs.send('service_tqqxijq', 'template_8gjdtqx', templateParams);
      console.log(`PIN (${pin}) enviado exitosamente a: ${email}`);
    } catch (error) {
      console.error('Error al enviar el PIN con EmailJS:', error);
    }
  }
}