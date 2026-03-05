import { Injectable, inject } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, authState } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc } from '@angular/fire/firestore';
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

    const userRef = doc(this.firestore, `usuarios/${user.uid}`);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await signOut(this.auth);
      throw new Error('No tienes una cuenta creada. Por favor, regístrate primero.');
    }

    const userData = docSnap.data() as any;

    // Si el usuario existe pero no ha verificado su PIN, se lo reenviamos automáticamente
    if (userData.pinVerificado === false) {
      console.log('Usuario no verificado, re-enviando PIN...');
      await this.enviarEmailPin(
        user.email!,
        userData.nombre || userData.NombreCompleto || 'Usuario',
        userData.pin
      );
    }

    // Retornamos todo el objeto para que el componente valide el PIN
    return {
      uid: user.uid,
      ...userData
    };
  }

  async marcarPinComoVerificado(uid: string) {
    const userRef = doc(this.firestore, `usuarios/${uid}`);
    return await updateDoc(userRef, { pinVerificado: true });
  }

  async reenviarPin(uid: string) {
    const userRef = doc(this.firestore, `usuarios/${uid}`);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data() as any;
      await this.enviarEmailPin(
        userData.correo || userData.email,
        userData.nombre || userData.NombreCompleto || 'Usuario',
        userData.pin
      );
    } else {
      throw new Error('Usuario no encontrado para reenviar el PIN.');
    }
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