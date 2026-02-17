import { Injectable, inject } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, authState } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import emailjs from '@emailjs/browser';

@Injectable({
  providedIn: 'root',
})
export class GoogleService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  constructor() {
    emailjs.init('RH7T2EvEV4pbSWkXQ');
  }

  // REGISTRO: Crea el usuario con pinVerificado en false
  async registerWithGoogle(datosFormulario: any) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(this.auth, provider);
    const user = result.user;

    const userRef = doc(this.firestore, `usuarios/${user.uid}`);
    await setDoc(userRef, {
      uid: user.uid,
      correo: user.email,
      nombre: datosFormulario.NombreCompleto,
      telefono: datosFormulario.Telefono,
      rol: datosFormulario.Rol,
      pin: datosFormulario.pin,
      pinVerificado: false, // Flag para saber si ya validó el PIN alguna vez
      activo: true,
      fechaRegistro: new Date()
    });

    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + 25 * 60000);
    const horaFormateada = expiracion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const templateParams = {
      pin_seguridad: datosFormulario.pin,
      fecha: horaFormateada,
      to_email: user.email, // IMPORTANTE: Asegúrate que en EmailJS tu plantilla use {{to_email}}
      nombre_usuario: datosFormulario.NombreCompleto
    };

    try {
      await emailjs.send('service_tqqxijq', 'template_8gjdtqx', templateParams);
      console.log('Correo de HTAS enviado con éxito');
    } catch (error) {
      console.error('Error EmailJS:', error);
    }

    return user;
  }

  // LOGIN: Obtiene los datos para verificar el estado del PIN
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);

    const userRef = doc(this.firestore, `usuarios/${result.user.uid}`);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await signOut(this.auth);
      throw new Error('No tienes una cuenta creada. Por favor, regístrate primero.');
    }

    return docSnap.data();
  }

  // Actualiza el estado para que no vuelva a pedir el PIN
  async marcarPinComoVerificado(uid: string) {
    const userRef = doc(this.firestore, `usuarios/${uid}`);
    return await updateDoc(userRef, { pinVerificado: true });
  }

  logout() { return signOut(this.auth); }
  get user$(): Observable<any> { return authState(this.auth); }
}