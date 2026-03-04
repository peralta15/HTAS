import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard/1',  // ← Cambiado a dashboard/1
    pathMatch: 'full'
  },
  {
    path: 'dashboard/:patientId',  // ← Acepta parámetro
    loadComponent: () =>
      import('./dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  }
];