import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  authState
} from '@angular/fire/auth';
import { User } from '../interfaces/user.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Google {
  private auth = inject(Auth);

  constructor() { }

  register(user: User) {
    return createUserWithEmailAndPassword(this.auth, user.email, user.password);
  }

  login(user: User) {
    return signInWithEmailAndPassword(this.auth, user.email, user.password);
  }

  logInGoogle() {
    return signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  logLogout() {
    return signOut(this.auth);
  }

  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  get user$(): Observable<any> {
    return authState(this.auth);
  }
}