import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Menu } from "../../template/menu/menu";
import { FormsModule } from '@angular/forms';
import { Users } from '../../../auth/services/users';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

declare var flatpickr: any;

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [Menu, CommonModule, FormsModule],
  templateUrl: './citas.html',
  styleUrl: './citas.css',
})
export class Citas implements OnInit {
  private usersService = inject(Users);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  citasTodo: any[] = [];
  searchTerm: string = '';
  expandedId: number | null = null;
  currentUser: any = null;

  // Paginación
  paginaActual = 0;
  itemsPorPagina = 10;

  // Selección y Modal
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

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('user_htas');
      if (saved) {
        this.currentUser = JSON.parse(saved);
        await this.cargarCitas();
      }
    }
  }

  async cargarCitas() {
    if (!this.currentUser || !this.currentUser.correo) return;

    try {
      // Ahora usamos el CORREO para buscar en la tabla plana
      const data = await firstValueFrom(this.usersService.getMisCitas(this.currentUser.correo));

      this.citasTodo = data.map(c => ({
        ...c,
        id: c.idcita,
        // Como la tabla es plana, los nombres ya vienen ahí
        NombreMostrar: `${c.nombrepaciente} ${c.appaternopaciente}`
      }));

      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al cargar citas:', error);
    }
  }

  // --- GETTERS PARA FILTRADO Y PAGINACIÓN ---
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
    // Copiamos el estado y las notas actuales para que aparezcan en el modal
    this.citaSeleccionada = {
      ...c,
      tempEstado: c.estado,
      notasdoctor: c.notasdoctor || ''
    };
  }

  abrirCrearCita() {
    this.nuevaCita = {
      fecha: '',
      hora: '',
      motivo: '',
      modalidad: 'Presencial',
      sintomas: ''
    };
    this.mostrarModalCrear = true;

    // 3. Forzamos a Angular a notar el cambio de la bandera
    this.cdr.detectChanges();
    this.inicializarCalendario();
  }

  async guardarNuevaCita() {
    if (!this.nuevaCita.fecha || !this.nuevaCita.hora || !this.nuevaCita.motivo) {
      Swal.fire('Atención', 'Por favor llena los campos obligatorios', 'warning');
      return;
    }

    this.isSaving = true;

    // Preparamos el objeto con los datos planos del usuario actual
    const citaParaEnviar = {
      nombrePaciente: this.currentUser.nombre,
      apPaternoPaciente: this.currentUser.apPaterno,
      apMaternoPaciente: this.currentUser.apMaterno || '',
      telefonoPaciente: this.currentUser.telefono,
      correoPaciente: this.currentUser.correo,
      fechaCita: this.nuevaCita.fecha,
      horaCita: this.nuevaCita.hora,
      motivo: this.nuevaCita.motivo,
      modalidad: this.nuevaCita.modalidad,
      sintomas: this.nuevaCita.sintomas || 'Sin síntomas'
    };

    try {
      await firstValueFrom(this.usersService.crearCita(citaParaEnviar));
      await this.cargarCitas();
      this.cerrarModal();
      Swal.fire('¡Éxito!', 'Cita agendada correctamente', 'success');
    } catch (error) {
      console.error('Error al guardar cita:', error);
      Swal.fire('Error', 'No se pudo agendar la cita en el servidor', 'error');
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
        notasDoctor: this.citaSeleccionada.notasdoctor // Asegúrate que el backend espere notasDoctor o notasdoctor
      };

      await firstValueFrom(
        this.usersService.actualizarEstadoCita(this.citaSeleccionada.idcita, datosUpdate)
      );

      await this.cargarCitas();
      this.cerrarModal();
      this.citaSeleccionada = null; // Limpiamos selección
      Swal.fire('¡Éxito!', 'La cita ha sido actualizada', 'success');
    } catch (error) {
      console.error('Error al actualizar:', error);
      Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async confirmarEliminarCita() {
    if (!this.citaSeleccionada) return;
    this.isDeleting = true;

    try {
      await firstValueFrom(
        this.usersService.actualizarEstadoCita(this.citaSeleccionada.idcita, { estado: 'Cancelada' })
      );
      await this.cargarCitas();
      this.cerrarModal();
      this.citaSeleccionada = null;
      Swal.fire('Cancelada', 'La cita ha sido cancelada con éxito', 'success');
    } catch (error) {
      console.error('Error al cancelar:', error);
      Swal.fire('Error', 'No se pudo cancelar la cita', 'error');
    } finally {
      this.isDeleting = false;
      this.cdr.detectChanges();
    }
  }

  // --- MÉTODOS QUE FALTABAN PARA EL HTML ---

  // Controla la expansión de las filas para ver detalles
  toggleExpand(id: number, event: Event) {
    event.stopPropagation();
    this.expandedId = this.expandedId === id ? null : id;
  }

  // Abre el modal de edición (Solo para Doctores)
  abrirEditarCita() {
    if (!this.citaSeleccionada) {
      Swal.fire('Atención', 'Selecciona una cita de la tabla primero', 'info');
      return;
    }
    this.mostrarModalEdit = true;
  }

  // Abre el modal de confirmación para cancelar
  abrirEliminarCita() {
    if (!this.citaSeleccionada) {
      Swal.fire('Atención', 'Selecciona una cita para cancelar', 'info');
      return;
    }
    this.mostrarModalDelete = true;
  }

  cerrarModal() {
    this.mostrarModalCrear = false;
    this.mostrarModalEdit = false;
    this.mostrarModalDelete = false;
  }

  inicializarCalendario() {
    if (isPlatformBrowser(this.platformId)) {
      // El setTimeout es obligatorio para esperar a que el modal aparezca en el DOM
      setTimeout(() => {

        // 1. CONFIGURACIÓN PARA LA FECHA
        const configFecha: any = {
          locale: Spanish,
          dateFormat: "Y-m-d",
          altInput: true,
          altFormat: "d/m/Y",
          // ESTA LÍNEA ES LA QUE ARREGLA EL DISEÑO (Evita que se encoja)
          altInputClass: "form-control datepicker-input input-clean",
          minDate: "today",
          appendTo: document.body,
          disableMobile: true,
          onChange: (selectedDates: any, dateStr: string) => {
            // Si estamos creando una cita nueva
            if (this.mostrarModalCrear) {
              this.nuevaCita.fecha = dateStr;
            }
            // Si estamos editando una existente
            else if (this.citaSeleccionada) {
              this.citaSeleccionada.fechacita = dateStr;
            }
            this.cdr.detectChanges();
          }
        };

        // 2. CONFIGURACIÓN PARA LA HORA (Personalizada como el calendario)
        const configHora: any = {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          time_24hr: true,
          altInput: true,
          // También aplicamos las clases premium aquí
          altInputClass: "form-control timepicker-input input-clean",
          appendTo: document.body,
          onChange: (selectedDates: any, dateStr: string) => {
            if (this.mostrarModalCrear) {
              this.nuevaCita.hora = dateStr;
            }
            this.cdr.detectChanges();
          }
        };

        // Inicializamos ambos selectores
        flatpickr(".datepicker-input", configFecha);
        flatpickr(".timepicker-input", configHora);

      }, 0);
    }
  }
}