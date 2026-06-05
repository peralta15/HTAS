import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Menu } from "../../template/menu/menu";
import { FormsModule } from '@angular/forms';
import { Users } from '../../../auth/services/users';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

declare var flatpickr: any;

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [Menu, CommonModule, FormsModule],
  templateUrl: './citas.html',
  styleUrl: './citas.css',
})
export class Citas implements OnInit, OnDestroy {
  private usersService = inject(Users);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  citasTodo: any[] = [];
  searchTerm: string = '';
  expandedId: number | null = null;
  currentUser: any = null;

  // Paginación
  paginaActual = 0;
  itemsPorPagina = 10;

  // Selección y Modales
  citaSeleccionada: any = null;
  mostrarModalCrear = false;
  mostrarModalEdit = false;
  mostrarModalDelete = false;
  isSaving = false;
  isDeleting = false;

  nuevaCita: any = {
    fecha: '',
    hora: '',
    motivo: '',
    modalidad: 'Presencial',
    sintomas: ''
  };

  // Sistema de Notificaciones Premium integradas (Reemplazo de Swal)
  mostrarToast = false;
  mensajeToast = '';
  tipoToast: 'success' | 'error' | 'warning' = 'success';
  private toastTimeout: any = null;

  // Instancias locales de Flatpickr para destruirlas adecuadamente
  private fpFechaInstance: any = null;
  private fpHoraInstance: any = null;

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('user_htas');
      if (saved) {
        this.currentUser = JSON.parse(saved);
        await this.cargarCitas();
      }
    }
  }

  ngOnDestroy() {
    this.destruirCalendarios();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  // Controlador de Lanzamiento de Notificación Flotante
  lanzarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'warning' = 'success') {
    this.mensajeToast = mensaje;
    this.tipoToast = tipo;
    this.mostrarToast = true;
    this.cdr.detectChanges();

    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    this.toastTimeout = setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  async cargarCitas() {
    if (!this.currentUser || !this.currentUser.correo) return;
    try {
      const data = await firstValueFrom(this.usersService.getMisCitas(this.currentUser.correo));
      this.citasTodo = data.map(c => ({
        ...c,
        id: c.idcita,
        NombreMostrar: `${c.nombrepaciente} ${c.appaternopaciente}`
      }));
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al cargar citas:', error);
    }
  }

  get citasFiltradas() {
    if (!this.searchTerm) return this.citasTodo;
    const term = this.searchTerm.toLowerCase();
    return this.citasTodo.filter(c =>
      c.NombreMostrar?.toLowerCase().includes(term) ||
      c.motivo?.toLowerCase().includes(term) ||
      c.estado?.toLowerCase().includes(term)
    );
  }

  get citasPaginadas() {
    const inicio = this.paginaActual * this.itemsPorPagina;
    return this.citasFiltradas.slice(inicio, inicio + this.itemsPorPagina);
  }

  cambiarPagina(delta: number) {
    const totalPaginas = Math.ceil(this.citasFiltradas.length / this.itemsPorPagina);
    const nuevaPagina = this.paginaActual + delta;
    if (nuevaPagina >= 0 && nuevaPagina < totalPaginas) {
      this.paginaActual = nuevaPagina;
    }
  }

  seleccionarCita(c: any) {
    this.citaSeleccionada = {
      ...c,
      tempEstado: c.estado,
      notasdoctor: c.notasdoctor || ''
    };
  }

  abrirCrearCita() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    this.nuevaCita = {
      fecha: `${anio}-${mes}-${dia}`,
      hora: '10:00',
      motivo: '',
      modalidad: 'Presencial',
      sintomas: ''
    };
    this.mostrarModalCrear = true;
    this.cdr.detectChanges();
    this.inicializarCalendario();
  }

  async guardarNuevaCita() {
    if (!this.nuevaCita.fecha || !this.nuevaCita.hora || !this.nuevaCita.motivo.trim()) {
      this.lanzarNotificacion('Por favor llena los campos obligatorios del formulario.', 'warning');
      return;
    }

    this.isSaving = true;

    const citaParaEnviar = {
      nombrePaciente: this.currentUser.nombre,
      apPaternoPaciente: this.currentUser.apPaterno,
      apMaternoPaciente: this.currentUser.apMaterno || '',
      telefonoPaciente: this.currentUser.telefono ? String(this.currentUser.telefono) : null,
      correoPaciente: this.currentUser.correo,
      fechaCita: this.nuevaCita.fecha,
      horaCita: this.nuevaCita.hora.length === 5 ? `${this.nuevaCita.hora}:00` : this.nuevaCita.hora,
      motivo: this.nuevaCita.motivo.trim(),
      modalidad: this.nuevaCita.modalidad,
      sintomas: this.nuevaCita.sintomas.trim() || 'Sin síntomas',
      estado: 'Programada'
    };

    try {
      await firstValueFrom(this.usersService.crearCita(citaParaEnviar));
      await this.cargarCitas();
      this.cerrarModal();
      this.lanzarNotificacion('¡Éxito! Tu cita médica ha sido agendada correctamente.', 'success');
    } catch (error) {
      console.error('Error al guardar cita:', error);
      this.lanzarNotificacion('No se pudo agendar la cita médica en el servidor.', 'error');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async guardarCambiosCita() {
    if (!this.citaSeleccionada) return;
    this.isSaving = true;

    try {
      const datosUpdate = {
        estado: this.citaSeleccionada.tempEstado,
        notasDoctor: this.citaSeleccionada.notasdoctor
      };

      await firstValueFrom(this.usersService.actualizarEstadoCita(this.citaSeleccionada.idcita, datosUpdate));
      await this.cargarCitas();
      this.cerrarModal();
      this.citaSeleccionada = null;
      this.lanzarNotificacion('La cita médica ha sido actualizada con éxito.', 'success');
    } catch (error) {
      console.error('Error al actualizar:', error);
      this.lanzarNotificacion('No se pudieron guardar los cambios de la cita.', 'error');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async confirmarEliminarCita() {
    if (!this.citaSeleccionada) return;
    this.isDeleting = true;

    try {
      await firstValueFrom(this.usersService.actualizarEstadoCita(this.citaSeleccionada.idcita, { estado: 'Cancelada' }));
      await this.cargarCitas();
      this.cerrarModal();
      this.citaSeleccionada = null;
      this.lanzarNotificacion('La cita médica ha sido cancelada con éxito.', 'success');
    } catch (error) {
      console.error('Error al cancelar:', error);
      this.lanzarNotificacion('Hubo un problema y no se pudo cancelar la cita.', 'error');
    } finally {
      this.isDeleting = false;
      this.cdr.detectChanges();
    }
  }

  toggleExpand(id: number, event: Event) {
    event.stopPropagation();
    this.expandedId = this.expandedId === id ? null : id;
  }

  abrirEditarCita() {
    if (!this.citaSeleccionada) {
      this.lanzarNotificacion('Selecciona una cita de la tabla primero.', 'warning');
      return;
    }
    const id = this.citaSeleccionada.idcita || this.citaSeleccionada.id;
    this.router.navigate(['/citas/editar', id], { state: { cita: this.citaSeleccionada } });
  }

  abrirEliminarCita() {
    if (!this.citaSeleccionada) {
      this.lanzarNotificacion('Selecciona una cita para cancelar.', 'warning');
      return;
    }
    this.mostrarModalDelete = true;
  }

  cerrarModal() {
    this.destruirCalendarios();
    this.mostrarModalCrear = false;
    this.mostrarModalEdit = false;
    this.mostrarModalDelete = false;
  }

  inicializarCalendario() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const hoy = new Date();
        const fechaMaximaCita = new Date(hoy.getFullYear(), hoy.getMonth() + 2, hoy.getDate());

        // 1. SELECTOR PARA FECHA
        this.fpFechaInstance = flatpickr("#fechaCitaInput", {
          locale: Spanish,
          dateFormat: "Y-m-d",
          defaultDate: this.nuevaCita.fecha || "today",
          minDate: "today",
          maxDate: fechaMaximaCita,
          appendTo: document.body,
          static: false,
          disableMobile: true,
          onChange: (selectedDates: any, dateStr: string) => {
            this.nuevaCita.fecha = dateStr;
            this.cdr.detectChanges();
          }
        });

        // 2. SELECTOR PARA HORA
        this.fpHoraInstance = flatpickr("#horaCitaInput", {
          locale: Spanish,
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
          defaultDate: this.nuevaCita.hora || "10:00",
          appendTo: document.body,
          static: false,
          disableMobile: true,
          onChange: (selectedDates: any, dateStr: string) => {
            this.nuevaCita.hora = dateStr;
            this.cdr.detectChanges();
          }
        });
      }, 50);
    }
  }

  destruirCalendarios() {
    if (this.fpFechaInstance) {
      this.fpFechaInstance.destroy();
      this.fpFechaInstance = null;
    }
    if (this.fpHoraInstance) {
      this.fpHoraInstance.destroy();
      this.fpHoraInstance = null;
    }
  }
}