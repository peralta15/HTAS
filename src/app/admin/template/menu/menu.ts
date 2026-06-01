import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription, Observable, combineLatest, of } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { GoogleService } from '../../../auth/services/google';
import { Users } from '../../../auth/services/users';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit, OnDestroy {
  private googleService = inject(GoogleService);
  private usersService = inject(Users);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private authSub?: Subscription;

  isCollapsed = false;
  showSearch = false;

  public user$: Observable<any> = this.googleService.user$;
  userName: string = 'Usuario';
  userPhoto: string = '';

  navItems = [
    { category: 'General', items: [{ route: '/inicio', icon: 'bi-speedometer2', label: 'Dashboard' }] },
    {
      category: 'Administración',
      items: [
        { route: '/usuarios', icon: 'bi-people', label: 'Usuarios' },
        { route: '/medicos', icon: 'bi-person-badge', label: 'Médicos' },
        { route: '/pacientes', icon: 'bi-person-heart', label: 'Pacientes' },
        { route: '/acompanantes', icon: 'bi-person-fill-add', label: 'Acompañantes' }
      ]
    },
    { category: 'Seguimiento', items: [{ route: '/citas', icon: 'bi-calendar-check', label: 'Citas' }, { route: '/tratamientos', icon: 'bi bi-clipboard-data', label: 'Tratamientos' }, { route: '/medicamentos', icon: 'bi-capsule', label: 'Medicamentos' }, { route: '/dispositivos', icon: 'bi-heart-pulse', label: 'Dispositivos' }] },
    { category: 'Cuenta', items: [{ route: '/config', icon: 'bi-gear', label: 'Configuración' }, { route: '/login', icon: 'bi-box-arrow-right', label: 'Cerrar Sesión' }] }
  ];

  ngOnInit() {
    const uService = this.usersService as any;
    // Detectar si estamos en el navegador
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser && uService.cargarSesionPersistente) {
      uService.cargarSesionPersistente();
    }

    this.authSub = combineLatest([
      this.googleService.user$.pipe(startWith(null)),
      (uService.currentUser$ || of(null)).pipe(startWith(null))
    ]).subscribe((res: any[]) => {
      const gUser = res[0];

      // PROTECCIÓN: Solo intentar leer localStorage si es el navegador
      let pUser = res[1];
      if (!pUser && isBrowser) {
        const saved = localStorage.getItem('user_htas');
        pUser = saved ? JSON.parse(saved) : null;
      }

      if (pUser) {
        this.userName = pUser.nombre || pUser.NombreCompleto || 'Usuario';
        this.userPhoto = pUser.photoURL || this.generarAvatar(this.userName);
      } else if (gUser) {
        this.userName = gUser.nombre || gUser.displayName || 'Usuario';
        this.userPhoto = gUser.photoURL || this.generarAvatar(this.userName);
      } else {
        this.userName = 'Invitado';
        this.userPhoto = this.generarAvatar('Invitado');
      }

      // Evita el error NG0100 usando un pequeño delay
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
    });
  }

  private generarAvatar(nombre: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=b0001e&color=fff&bold=true`;
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  toggleSidebar() { this.isCollapsed = !this.isCollapsed; }
  toggleSearch() { this.showSearch = !this.showSearch; }
  onSearch(v: string) { if (v.trim()) console.log('Buscando:', v); }

  logout() {
    this.googleService.logout();
    const service = this.usersService as any;
    if (service.limpiarSesion) service.limpiarSesion();
    this.router.navigate(['/login']);
  }
}