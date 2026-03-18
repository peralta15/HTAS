import { Injectable, inject } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, authState } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import emailjs from '@emailjs/browser';

@Injectable({
  providedIn: 'root',
})
export class GoogleService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/auth';

  constructor() {
    emailjs.init('RH7T2EvEV4pbSWkXQ');
  }

  async registerWithGoogle(datosFormulario: any) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(this.auth, provider);
    const user = result.user;

    const userRef = doc(this.firestore, `usuarios/${user.uid}`);

    // Unimos los datos del formulario con los de Google Auth
    const payload = {
      ...datosFormulario,
      uid: user.uid,
      correo: user.email,
      fechaRegistro: new Date()
    };

    await setDoc(userRef, payload);

    // Enviar el PIN por correo al registrarse
    await this.enviarEmailPin(
      user.email!,
      datosFormulario.nombre || datosFormulario.NombreCompleto || 'Usuario',
      datosFormulario.pin
    );

    return user;
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
      await emailjs.send('service_tqqxijq', 'template_8gjdtqx', templateParams);
      console.log(`PIN enviado exitosamente a: ${email}`);
    } catch (error) {
      console.error('Error al enviar el PIN con EmailJS:', error);
    }
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    const user = result.user;

    const nombreCompleto = user.displayName || 'Usuario';
    const partes = nombreCompleto.split(' ');

    const datosParaBackend = {
      correo: user.email,
      nombre: partes[0] || 'Usuario',
      apPaterno: partes[1] || '',
      apMaterno: partes.slice(2).join(' ') || '',
      uid_firebase: user.uid
    };

    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/google-login`, datosParaBackend)
      );

      // Si el usuario no está verificado, mandamos el PIN que nos dio el backend
      if (response && response.pinVerificado === false) {
        await this.enviarEmailPin(user.email!, response.nombre, response.pin);
      }

      return response;
    } catch (error: any) {
      await signOut(this.auth);
      throw new Error(error.error?.error || 'Error al conectar con el servidor');
    }
  }

  async marcarPinComoVerificado(uid: string) {
    return firstValueFrom(this.http.post(`${this.apiUrl}/verify-pin`, { uid }));
  }

  async getUsuarios() {
    const usersRef = collection(this.firestore, 'usuarios');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  }

  async updateUsuario(uid: string, data: any) {
    const userRef = doc(this.firestore, `usuarios/${uid}`);
    return await updateDoc(userRef, data);
  }

  async deleteUsuario(uid: string) {
    const userRef = doc(this.firestore, `usuarios/${uid}`);
    return await deleteDoc(userRef);
  }

  logout() { return signOut(this.auth); }
  get user$(): Observable<any> { return authState(this.auth); }
}