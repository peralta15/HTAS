import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Menu } from "../../template/menu/menu";
import { FormsModule } from '@angular/forms';
import { GoogleService } from '../../../auth/services/google';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

@Component({
  selector: 'app-acompanantes',
  imports: [Menu, CommonModule, FormsModule],
  templateUrl: './acompanantes.html',
  styleUrl: './acompanantes.css',
})
export class Acompanantes implements OnInit {
  private googleService = inject(GoogleService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  usuariosTodo: any[] = [];
  searchTerm: string = '';
  expandedId: string | null = null;

  // Paginación
  paginaActual = 0;
  itemsPorPagina = 10;

  // Selección y Modal
  usuarioSeleccionado: any = null;
  mostrarModalEdit = false;
  mostrarModalDelete = false;
  isSaving = false;
  isDeleting = false;

  async ngOnInit() {
    await this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.googleService.getUsuarios().then(users => {
      // Filtrar solo para que muestre Acompañantes
      this.usuariosTodo = users.filter(u => (u.rol || u.Rol) === 'Acompañante');
      this.cdr.detectChanges();
    }).catch(error => {
      console.error('Error al cargar usuarios:', error);
    });
  }

  get usuariosFiltrados() {
    if (!this.searchTerm) return this.usuariosTodo;
    const term = this.searchTerm.toLowerCase();
    return this.usuariosTodo.filter(u =>
      u.NombreCompleto?.toLowerCase().includes(term) ||
      u.nombre?.toLowerCase().includes(term) ||
      u.correo?.toLowerCase().includes(term) ||
      u.telefono?.toLowerCase().includes(term)
    );
  }

  get usuariosPaginados() {
    const inicio = this.paginaActual * this.itemsPorPagina;
    return this.usuariosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  cambiarPagina(delta: number) {
    const totalPaginas = Math.ceil(this.usuariosFiltrados.length / this.itemsPorPagina);
    const nuevaPagina = this.paginaActual + delta;
    if (nuevaPagina >= 0 && nuevaPagina < totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.usuarioSeleccionado = null;
    }
  }

  seleccionar(u: any) {
    this.usuarioSeleccionado = { ...u }; // Creamos una copia para editar

    // Separar el nombre completo en partes
    const nombreCompleto = u.NombreCompleto || u.nombre || '';
    const partes = nombreCompleto.trim().split(/\s+/);

    if (partes.length >= 3) {
      // Caso ideal: Nombre(s) ApellidoPaterno ApellidoMaterno
      this.usuarioSeleccionado.tempApellidoMaterno = partes.pop();
      this.usuarioSeleccionado.tempApellidoPaterno = partes.pop();
      this.usuarioSeleccionado.tempNombre = partes.join(' ');
    } else if (partes.length === 2) {
      // Caso: Nombre Apellido
      this.usuarioSeleccionado.tempNombre = partes[0];
      this.usuarioSeleccionado.tempApellidoPaterno = partes[1];
      this.usuarioSeleccionado.tempApellidoMaterno = '';
    } else {
      // Caso: Solo un nombre o vacío
      this.usuarioSeleccionado.tempNombre = nombreCompleto;
      this.usuarioSeleccionado.tempApellidoPaterno = '';
      this.usuarioSeleccionado.tempApellidoMaterno = '';
    }
  }

  toggleExpand(id: string, event: Event) {
    event.stopPropagation();
    this.expandedId = this.expandedId === id ? null : id;
  }

  abrirEditar() {
    this.mostrarModalEdit = true;
  }

  abrirEliminar() {
    this.mostrarModalDelete = true;
  }

  async guardarCambios() {
    if (!this.usuarioSeleccionado) return;

    this.isSaving = true;
    try {
      // Reconstruir el nombre completo
      const nombre = (this.usuarioSeleccionado.tempNombre || '').trim();
      const apPaterno = (this.usuarioSeleccionado.tempApellidoPaterno || '').trim();
      const apMaterno = (this.usuarioSeleccionado.tempApellidoMaterno || '').trim();

      const nombreCompleto = [nombre, apPaterno, apMaterno].filter(p => p).join(' ');

      this.usuarioSeleccionado.nombre = nombre;
      this.usuarioSeleccionado.NombreCompleto = nombreCompleto;

      // Limpiar campos temporales antes de guardar en la DB
      const { id, tempNombre, tempApellidoPaterno, tempApellidoMaterno, ...data } = this.usuarioSeleccionado;
      await this.googleService.updateUsuario(id, data);

      // Actualizar localmente
      const index = this.usuariosTodo.findIndex(u => u.id === id);
      if (index !== -1) {
        this.usuariosTodo[index] = { ...this.usuarioSeleccionado };
      }

      this.cerrarModal();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      alert('Error al guardar los cambios. Por favor, intenta de nuevo.');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async confirmarEliminar() {
    if (!this.usuarioSeleccionado) return;

    const idAEliminar = this.usuarioSeleccionado.id;

    // Actualización Optimista: Quitamos de la lista y cerramos modal al instante
    this.usuariosTodo = this.usuariosTodo.filter(u => u.id !== idAEliminar);
    this.usuarioSeleccionado = null;
    this.cerrarModal();
    this.cdr.detectChanges();

    try {
      await this.googleService.deleteUsuario(idAEliminar);
      console.log('Usuario eliminado de la base de datos');
    } catch (error) {
      console.error('Error al eliminar en segundo plano:', error);
      // Opcional: Podrías alertar que hubo un problema técnico aunque visualmente se borró
    } finally {
      this.isDeleting = false;
      this.cdr.detectChanges();
    }
  }

  cerrarModal() {
    this.mostrarModalEdit = false;
    this.mostrarModalDelete = false;
    this.isSaving = false;
    this.isDeleting = false;
  }

  inicializarCalendario() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const hoy = new Date();
        const fechaMaxima = new Date(hoy.getFullYear(), hoy.getMonth() + 2, hoy.getDate());

        const config: any = {
          locale: Spanish,
          dateFormat: "Y-m-d",
          minDate: "today",
          maxDate: fechaMaxima,
          appendTo: document.body,
          static: false,
          disableMobile: true,
          onChange: (selectedDates: any, dateStr: string) => {
            if (this.usuarioSeleccionado) {
              this.usuarioSeleccionado.fechaAsignacion = dateStr;
              this.cdr.detectChanges();
            }
          }
        };

        const fp = flatpickr('#fechaInput', config);
        if (fp) {
          const instance = Array.isArray(fp) ? fp[0] : fp;
          if (instance && typeof instance.open === 'function') {
            instance.open();
          }
        }
      }, 50);
    }
  }
}
