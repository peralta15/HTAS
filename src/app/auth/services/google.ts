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

    // Configuración EmailJS
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + 25 * 60000);
    const horaFormateada = expiracion.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const templateParams = {
      pin_seguridad: datosFormulario.pin,
      fecha: horaFormateada,
      to_email: user.email,
      nombre_usuario: datosFormulario.nombre || datosFormulario.NombreCompleto
    };

    try {
      await emailjs.send('service_tqqxijq', 'template_8gjdtqx', templateParams);
      console.log('Correo enviado');
    } catch (error) {
      console.error('Error EmailJS:', error);
    }

    return user;
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);

    const userRef = doc(this.firestore, `usuarios/${result.user.uid}`);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await signOut(this.auth);
      throw new Error('No tienes una cuenta creada. Por favor, regístrate primero.');
    }

    // Retornamos todo el objeto para que el componente valide el PIN
    return {
      uid: result.user.uid,
      ...docSnap.data()
    };
  }

  async marcarPinComoVerificado(uid: string) {
    const userRef = doc(this.firestore, `usuarios/${uid}`);
    return await updateDoc(userRef, { pinVerificado: true });
  }

  logout() { return signOut(this.auth); }
  get user$(): Observable<any> { return authState(this.auth); }
}