import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu } from "../menu/menu";
import { GoogleService } from '../../../auth/services/google';
import { Firestore, doc, getDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, Menu],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private googleService = inject(GoogleService);
  private firestore = inject(Firestore);
  private cdr = inject(ChangeDetectorRef);
  user$: Observable<any> = this.googleService.user$;

  userName: string = '';
  userEmail: string = '';
  userPhoto: string = '';
  userPhone: string = '';
  userRole: string = 'Usuario';
  isActive: boolean = true;
  createdAt: string = 'Reciente';

  ngOnInit() {
    this.user$.subscribe(async authUser => {
      if (authUser) {
        // 1. Initial data from Google Auth
        this.userName = authUser.displayName || 'No disponible';
        this.userEmail = authUser.email || 'No disponible';
        this.userPhoto = authUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=b0001e&color=fff&bold=true&size=128`;
        this.cdr.detectChanges();

        try {
          let userData: any = null;

          // 2. Try fetching by Google UID
          const userRef = doc(this.firestore, `usuarios/${authUser.uid}`);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            userData = snap.data();
          } else {
            // 3. Fallback: Search by email in the entire collection
            const usersRef = collection(this.firestore, 'usuarios');
            const q = query(usersRef, where('correo', '==', this.userEmail));
            const querySnap = await getDocs(q);

            if (!querySnap.empty) {
              userData = querySnap.docs[0].data();
            } else {
              // Try uppercase field just in case
              const q2 = query(usersRef, where('Correo', '==', this.userEmail));
              const querySnap2 = await getDocs(q2);
              if (!querySnap2.empty) {
                userData = querySnap2.docs[0].data();
              }
            }
          }

          // 4. Update UI if data found
          if (userData) {
            this.userName = userData['nombre'] || userData['NombreCompleto'] || this.userName;
            this.userEmail = userData['correo'] || userData['Correo'] || this.userEmail;
            this.userPhone = userData['telefono'] || userData['Telefono'] || 'Sin registrar';
            this.userRole = userData['rol'] || userData['Rol'] || 'Usuario';
            this.isActive = userData['activo'] !== undefined ? userData['activo'] : true;

            const dateField = userData['fechaRegistro'] || userData['fechaCreacion'] || userData['fecha'] || userData['Fecha'];
            if (dateField) {
              const fecha = dateField.toDate ? dateField.toDate() : new Date(dateField);
              this.createdAt = fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
            }
          }
          this.cdr.detectChanges();
        } catch (error) {
          console.error('Error fetching extended user data:', error);
          this.cdr.detectChanges();
        }
      }
    });
  }
}
