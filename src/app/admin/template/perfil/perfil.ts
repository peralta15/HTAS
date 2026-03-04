import { Component, inject, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Menu } from "../menu/menu";

import { GoogleService } from '../../../auth/services/google';

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

  user$: Observable<any> = this.googleService.user$;



  // Variables para los campos solicitados

  userName: string = '';

  userEmail: string = '';

  userPhoto: string = '';

  userPhone: string = '';

  userRole: string = '';

  isActive: boolean = false;

  createdAt: string = '';



  ngOnInit() {

    this.user$.subscribe(user => {

      if (user) {

        this.userName = user.nombre || user.NombreCompleto || user.displayName || 'No disponible';

        this.userEmail = user.email || user.correo || 'No disponible';

        this.userPhone = user.telefono || user.phoneNumber || 'No registrado';

        this.userRole = user.rol || 'Usuario';

        this.isActive = user.activo !== undefined ? user.activo : true;



        // Formatear fecha si existe

        if (user.fechaCreacion) {

          this.createdAt = new Date(user.fechaCreacion).toLocaleDateString();

        } else {

          this.createdAt = 'Reciente';

        }



        this.userPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=b0001e&color=fff&bold=true&size=128`;

      }

    });

  }

}

