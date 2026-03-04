import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { ReportesComponent } from './reportes/reportes.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard/1',
    pathMatch: 'full'
  },
  {
    path: 'dashboard/:patientId',
    component: DashboardComponent,
    title: 'Dashboard - HTAS'
  },
  {
    path: 'usuarios',
    component: UsuariosComponent,
    title: 'Usuarios - HTAS'
  },
  {
    path: 'reportes',
    component: ReportesComponent,
    title: 'Reportes - HTAS'
  },
  {
    path: 'configuracion',
    component: ConfiguracionComponent,
    title: 'Configuración - HTAS'
  },
  {
    path: '**',
    redirectTo: 'dashboard/1'
  }
];