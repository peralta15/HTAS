import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  authState
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GoogleService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  constructor() { }

  // REGISTRO: Autentica con Google y guarda datos en Firestore
  async registerWithGoogle(datosFormulario: any) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(this.auth, provider);
    const user = result.user;

    // Guardamos en la colección 'usuarios' usando el UID de Google como ID
    const userRef = doc(this.firestore, `usuarios/${user.uid}`);
    await setDoc(userRef, {
      uid: user.uid,
      correo: datosFormulario.Correo || user.email,
      nombre: datosFormulario.NombreCompleto,
      telefono: datosFormulario.Telefono,
      rol: datosFormulario.Rol,
      activo: true,
      fechaRegistro: new Date()
    });

    return user;
  }

  // LOGIN: Autentica y verifica que el usuario ya exista en Firestore
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);

    const userRef = doc(this.firestore, `usuarios/${result.user.uid}`);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // Si el usuario no está en Firestore, lo deslogueamos de Auth
      await signOut(this.auth);
      throw new Error('No tienes una cuenta creada. Por favor, regístrate primero.');
    }

    return result.user;
  }

  logout() {
    return signOut(this.auth);
  }

  get user$(): Observable<any> {
    return authState(this.auth);
  }
}