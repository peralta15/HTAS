import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Login } from './auth/containers/login/login';
import { Register } from './auth/containers/register/register';
import { Breadcrumbs } from './pages/breadcrumbs/breadcrumbs';
import { Nosotros } from './pages/nosotros/nosotros';
import { Recursos } from './pages/recursos/recursos';
import { Contacto } from './pages/contacto/contacto';
import { Pagos } from './pages/pagos/pagos';
import { Error404 } from './pages/error-404/error-404';
import { Menu } from './admin/template/menu/menu';
import { Inicio } from './admin/pages/inicio/inicio';
import { Usuarios } from './admin/pages/usuarios/usuarios';
import { Perfil } from './admin/template/perfil/perfil';
import { Acompanantes } from './admin/pages/acompanantes/acompanantes';
import { AcompananteDetalle } from './admin/pages/acompanantes/acompanante-detalle/acompanante-detalle';
import { Pacientes } from './admin/pages/pacientes/pacientes';
import { PacienteDetalle } from './admin/pages/pacientes/paciente-detalle/paciente-detalle';
import { Medicos } from './admin/pages/medicos/medicos';
import { MedicoDetalle } from './admin/pages/medicos/medico-detalle/medico-detalle';
import { Notificaciones } from './admin/template/notificaciones/notificaciones';
import { Success } from './pages/success/success';
import { Citas } from './admin/pages/citas/citas';

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
    path: 'success',
    component: Success,
  },
  {
    path: 'pagos',
    component: Pagos,
  },
  {
    path: 'admin',
    component: Menu,
  },
  {
    path: 'inicio',
    component: Inicio
  },
  {
    path: 'usuarios',
    component: Usuarios
  },
  {
    path: 'medicos',
    component: Medicos
  },
  {
    path: 'medicos/editar/:id',
    component: MedicoDetalle
  },
  {
    path: 'pacientes',
    component: Pacientes
  },
  {
    path: 'pacientes/editar/:id',
    component: PacienteDetalle
  },
  {
    path: 'acompanantes',
    component: Acompanantes
  },
  {
    path: 'acompanantes/editar/:id',
    component: AcompananteDetalle
  },
  {
    path: 'citas',
    component: Citas
  },
  {
    path: 'perfil',
    component: Perfil
  },
  {
    path: 'notificaciones',
    component: Notificaciones
  },
  {
    path: '**',
    component: Error404
  }
];
