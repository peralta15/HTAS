import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu } from "../menu/menu";
import { Users } from '../../../auth/services/users'; // <--- Inyectamos directamente tu servicio existente

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, Menu],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css',
})
export class Notificaciones implements OnInit {
  public usersService = inject(Users); // <--- Inyección del servicio

  rolUsuario: string = '';
  loading: boolean = false;

  // Listas de datos reales extraídas desde el servicio Users
  registrosUsuarios: any[] = [];
  alertasMedicas: any[] = [];
  notificacionesPaciente: any[] = [];
  notificacionesAcompanante: any[] = [];

  ngOnInit() {
    // Nos suscribimos al estado del usuario logueado en tu servicio
    this.usersService.currentUser$.subscribe(user => {
      // Si por alguna razón no hay sesión en el Subject, intentamos levantar la persistente
      if (!user) {
        this.usersService.cargarSesionPersistente();
        return;
      }

      // Extraemos los datos reales guardados tras el login exitoso
      this.rolUsuario = user.rol;
      this.cargarNotificacionesDeServicio(user);
    });
  }

  cargarNotificacionesDeServicio(user: any) {
    this.loading = true;

    if (this.rolUsuario === 'Doctor') {
      // 1. Cargar todos los usuarios registrados del sistema (usando tu método real)
      this.usersService.getRegistrosUsuarios().subscribe({
        next: (res) => { this.registrosUsuarios = res; },
        error: (err) => console.error('Error al obtener usuarios en panel médico:', err)
      });

      // 2. Cargar alertas del médico (citas, tratamientos, dispositivos)
      this.usersService.getAlertasMedicas().subscribe({
        next: (res) => {
          this.alertasMedicas = res;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al obtener alertas médicas:', err);
          this.loading = false;
        }
      });
    }

    else if (this.rolUsuario === 'Paciente') {
      // Cargar notificaciones personalizadas para el paciente mediante su correo real
      this.usersService.getNotificacionesPaciente(user.correo || user.Email).subscribe({
        next: (res) => {
          this.notificacionesPaciente = res;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al obtener alertas del paciente:', err);
          this.loading = false;
        }
      });
    }

    else if (this.rolUsuario === 'Acompañante') {
      // Cargar alertas del acompañante usando su UID o ID numérico de la sesión
      this.usersService.getNotificacionesAcompanante(user.uid || user.IdUsuario).subscribe({
        next: (res) => {
          this.notificacionesAcompanante = res;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error al obtener alertas del acompañante:', err);
          this.loading = false;
        }
      });
    }
  }

  // selectores CSS dinámicos basados en la Paleta de Colores
  obtenerIconoClase(tipo: string): string {
    if (!tipo) return 'bg-secondary';
    const t = tipo.toLowerCase();
    if (t.includes('cita')) return 'bg-blue';
    if (t.includes('tratamiento')) return 'bg-purple';
    if (t.includes('dispositivo')) return 'bg-orange';
    if (t.includes('medicamento') || t.includes('toma')) return 'bg-green';
    if (t.includes('asign') || t.includes('acompañante')) return 'bg-red';
    return 'bg-secondary';
  }

  obtenerIconoNotificacion(tipo: string): string {
    if (!tipo) return 'bi bi-bell-fill';
    const t = tipo.toLowerCase();
    if (t.includes('cita')) return 'bi bi-calendar-event-fill';
    if (t.includes('tratamiento')) return 'bi bi-capsules';
    if (t.includes('dispositivo')) return 'bi bi-cpu-fill';
    if (t.includes('medicamento') || t.includes('toma')) return 'bi bi-droplet-fill';
    if (t.includes('asign') || t.includes('acompañante')) return 'bi bi-person-heart';
    return 'bi bi-bell-fill';
  }
}