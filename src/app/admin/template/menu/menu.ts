import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
// AJUSTA ESTA RUTA SEGÚN TU ESTRUCTURA (ej. ../../../services/google)
import { GoogleService } from '../../../auth/services/google';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit, OnDestroy {
  // Inyección del servicio de autenticación
  private googleService = inject(GoogleService);
  private userSub?: Subscription;

  // Propiedades para la interfaz
  isCollapsed = false;
  showSearch = false;

  // ESTO CORRIGE EL ERROR DEL HTML: Declaración del observable para el pipe async
  public user$: Observable<any> = this.googleService.user$;

  // Variables para mostrar datos procesados
  userName: string = 'Usuario';
  userPhoto: string = '';

  // Estructura del menú lateral
  navItems = [
    {
      category: 'General', items: [
        { route: '/inicio', icon: 'bi-speedometer2', label: 'Dashboard' }
      ]
    },
    {
      category: 'Administración', items: [
        { route: '/usuarios', icon: 'bi-people', label: 'Usuarios' },
        { route: '/medicos', icon: 'bi-person-badge', label: 'Médicos' },
        { route: '/pacientes', icon: 'bi-person-heart', label: 'Pacientes' },
        { route: '/acompanantes', icon: 'bi-person-fill-add', label: 'Acompañantes' }
      ]
    },
    {
      category: 'Seguimiento', items: [
        { route: '/tratamientos', icon: 'bi-clipboard-pulse', label: 'Tratamientos' },
        { route: '/dispositivos', icon: 'bi-phone', label: 'Dispositivos' }
      ]
    },
    {
      category: 'Cuenta', items: [
        { route: '/config', icon: 'bi-gear', label: 'Configuración' },
        { route: '/login', icon: 'bi-box-arrow-right', label: 'Cerrar Sesión' }
      ]
    }
  ];

  ngOnInit() {
    // Nos suscribimos para procesar el nombre y la foto cuando cambie el usuario
    this.userSub = this.user$.subscribe({
      next: (user) => {
        if (user) {
          // Buscamos el nombre en los posibles campos de tu base de datos
          this.userName = user.nombre || user.NombreCompleto || user.displayName || 'Usuario';

          // Si tiene foto en Google la usa, si no, genera un avatar con la inicial
          if (user.photoURL) {
            this.userPhoto = user.photoURL;
          } else {
            this.userPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.userName)}&background=b0001e&color=fff&bold=true`;
          }
        }
      }
    });
  }

  ngOnDestroy() {
    // Evitamos fugas de memoria al destruir el componente
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  // Funciones de control de la UI
  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
  }

  onSearch(value: string) {
    if (value.trim()) {
      console.log('Buscando:', value);
    }
  }

  logout() {
    this.googleService.logout();
  }
}