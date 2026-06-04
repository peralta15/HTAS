import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Menu } from "../../template/menu/menu";
import { Users } from '../../../auth/services/users'; // Ajustado a tu ruta nativa de Auth
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, Menu],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  private usersService = inject(Users);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  isLoading = true;

  // Contadores dinámicos obtenidos de la clasificación por rol
  metrics = {
    totalUsuarios: 0,
    totalPacientes: 0,
    totalMedicos: 0,
    totalAcompanantes: 0
  };

  // Listados en tiempo real corregidos
  citasRecientes: any[] = [];
  medicamentosControl: any[] = [];

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      this.isLoading = true;

      // Recuperamos la sesión persistente estructurada de HTAS
      const sesionGuardada = localStorage.getItem('user_htas');
      const usuarioLogueado = sesionGuardada ? JSON.parse(sesionGuardada) : null;
      const correoUsuario = usuarioLogueado?.correo || '';

      // Consumo de endpoints paralelos del backend PostgreSQL
      const [usuarios, citas, medicamentos] = await Promise.all([
        firstValueFrom(this.usersService.getUsuariosBackend()),
        correoUsuario ? firstValueFrom(this.usersService.getMisCitas(correoUsuario)) : Promise.resolve([]),
        firstValueFrom(this.usersService.getMedicamentos())
      ]);

      // 1. Clasificación dinámica de usuarios por Rol
      if (Array.isArray(usuarios)) {
        this.metrics.totalUsuarios = usuarios.length;
        this.metrics.totalPacientes = usuarios.filter((u: any) => u.rol?.toLowerCase() === 'paciente').length;
        this.metrics.totalMedicos = usuarios.filter((u: any) => u.rol?.toLowerCase() === 'medico' || u.rol?.toLowerCase() === 'doctor').length;
        this.metrics.totalAcompanantes = usuarios.filter((u: any) => u.rol?.toLowerCase() === 'acompanante' || u.rol?.toLowerCase() === 'acompañante').length;
      }

      // 2. Mapeo con nombres exactos y formateo de fecha limpia (DD/MM/YYYY)
      if (Array.isArray(citas)) {
        this.citasRecientes = citas.map((c: any) => {
          let fechaFormateada = 'Sin fecha';

          if (c.fechacita) {
            try {
              // Al procesar strings ISO directos (con 'T'), extraemos solo la porción de la fecha 'YYYY-MM-DD'
              const fechaISO = c.fechacita.includes('T') ? c.fechacita.split('T')[0] : c.fechacita;
              const partes = fechaISO.split('-'); // [YYYY, MM, DD]

              if (partes.length === 3) {
                const anio = partes[0];
                const mes = partes[1];
                const dia = partes[2];

                fechaFormateada = `${dia}/${mes}/${anio}`; // Formato limpio DD/MM/YYYY
              } else {
                fechaFormateada = c.fechacita;
              }
            } catch (e) {
              console.error("Error al formatear la fecha:", e);
              fechaFormateada = c.fechacita;
            }
          }

          return {
            id: c.idcita,
            fecha: fechaFormateada,
            hora: c.horacita ? c.horacita.substring(0, 5) : 'S/H', // Corta el formato HH:mm:ss a HH:mm
            motivo: c.motivo || 'Consulta Médica General',
            modalidad: c.modalidad || 'Presencial',
            paciente: `${c.nombrepaciente || ''} ${c.appaternopaciente || ''}`.trim() || 'Paciente HTAS',
            estado: c.estado || 'Programada'
          };
        });
      }

      // 3. CORRECCIÓN: Procesamiento blindado del catálogo de medicamentos (Soporta minúsculas de la BD)
      if (Array.isArray(medicamentos)) {
        this.medicamentosControl = medicamentos.map((m: any) => ({
          nombre: m.nombreComercial || m.nombrecomercial || 'Medicamento Sin Nombre',
          sustancia: m.sustanciaActiva || m.sustanciaactiva || 'N/A',
          presentacion: m.presentacion || 'General',
          concentracion: m.concentracion || ''
        }));
      }

    } catch (error) {
      console.error("Error al sincronizar datos reales en la vista de Inicio:", error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Helper visual para los estados de las citas
  getEstadoClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
      case 'activa':
      case 'programada':
        return 'badge-success';
      case 'pendiente':
        return 'badge-warning';
      case 'cancelada':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  }
}