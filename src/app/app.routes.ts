import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Login } from './auth/containers/login/login';
import { Register } from './auth/containers/register/register';
import { Breadcrumbs } from './pages/breadcrumbs/breadcrumbs';
import { Nosotros } from './pages/nosotros/nosotros';
import { Recursos } from './pages/recursos/recursos';
import { Contacto } from './pages/contacto/contacto';
import { Pagos } from './pages/pagos/pagos';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/landing'
  },
  {
    path: 'landing',
    component: Landing,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'breadcrumbs',
    component: Breadcrumbs,
  },
  {
    path: 'nosotros',
    component: Nosotros,
  },
  {
    path: 'recursos',
    component: Recursos,
  },
  {
    path: 'contactos',
    component: Contacto,
  },
  {
    path: 'pagos',
    component: Pagos,
  }
];
