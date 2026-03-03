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
    { route: '/inicio', icon: 'bi-speedometer2', label: 'Dashboard' },
    { route: '/usuarios', icon: 'bi-people', label: 'Usuarios' },
    { route: '/reportes', icon: 'bi-bar-chart', label: 'Reportes' },
    { route: '/config', icon: 'bi-gear', label: 'Configuración' },
    { route: '/login', icon: 'bi-box-arrow-right', label: 'Cerrar Sesión' }
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
