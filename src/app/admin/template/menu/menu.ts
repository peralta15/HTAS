import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para *ngIf y *ngFor
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu',
  imports: [CommonModule, RouterModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
  isCollapsed = false;
  showSearch = false;

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

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
  toggleSearch() {
    this.showSearch = !this.showSearch;
  }

  onSearch(value: string) {
    if (value) {
      console.log('Buscando:', value);
      // Aquí puedes redirigir a una página de resultados o filtrar datos
      // this.router.navigate(['/admin/buscar'], { queryParams: { q: value } });
    }
  }
}
