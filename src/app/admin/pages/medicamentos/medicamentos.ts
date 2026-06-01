import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Menu } from "../../template/menu/menu";
import { Users } from '../../../auth/services/users';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-medicamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, Menu],
  templateUrl: './medicamentos.html',
  styleUrl: './medicamentos.css'
})
export class Medicamentos implements OnInit, OnDestroy {
  private router = inject(Router);
  private usersService = inject(Users);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  medicamentosTodo: any[] = [];
  searchTerm: string = '';

  // Paginación
  paginaActual = 0;
  itemsPorPagina = 10;

  // Selección y modales
  medicamentoSeleccionado: any = null;
  mostrarModalCrear = false;
  mostrarModalDelete = false;
  isSaving = false;
  isDeleting = false;

  // Estructura limpia adaptada al backend
  nuevoMedicamento: any = {
    nombreComercial: '',
    sustanciaActiva: '',
    presentacion: '',
    concentracion: '',
    laboratorio: '',
    indicacionesGenerales: ''
  };

  // Notificaciones Toast
  mostrarToast = false;
  mensajeToast = '';
  tipoToast: 'success' | 'error' | 'warning' = 'success';
  private toastTimeout: any = null;

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      await this.cargarMedicamentos();
    }
  }

  ngOnDestroy() {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

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

  async cargarMedicamentos() {
    try {
      const data = await firstValueFrom(this.usersService.getMedicamentos());
      this.medicamentosTodo = data || [];
    } catch (error) {
      console.error('Error al cargar medicamentos:', error);
      this.medicamentosTodo = [];
    } finally {
      this.cdr.detectChanges();
    }
  }

  get medicamentosFiltrados() {
    if (!this.searchTerm) return this.medicamentosTodo;
    const term = this.searchTerm.toLowerCase();
    return this.medicamentosTodo.filter(m => {
      const nom = (m.nombreComercial || m.nombrecomercial || '').toLowerCase();
      const sust = (m.sustanciaActiva || m.sustanciaactiva || '').toLowerCase();
      const lab = (m.laboratorio || '').toLowerCase();
      return nom.includes(term) || sust.includes(term) || lab.includes(term);
    });
  }

  get medicamentosPaginados() {
    const inicio = this.paginaActual * this.itemsPorPagina;
    return this.medicamentosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  cambiarPagina(delta: number) {
    const totalPaginas = Math.ceil(this.medicamentosFiltrados.length / this.itemsPorPagina);
    const nuevaPagina = this.paginaActual + delta;
    if (nuevaPagina >= 0 && nuevaPagina < totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.cdr.detectChanges();
    }
  }

  seleccionarMedicamento(m: any) {
    this.medicamentoSeleccionado = { ...m };
    this.cdr.detectChanges();
  }

  abrirDetalle(m: any) {
    const id = m.IdMedicamento || m.idmedicamento || m.id;
    this.router.navigate(['/medicamentos/editar', id], {
      state: { medicamento: m }
    });
  }

  abrirCrear() {
    this.nuevoMedicamento = {
      nombreComercial: '',
      sustanciaActiva: '',
      presentacion: '',
      concentracion: '',
      laboratorio: '',
      indicacionesGenerales: ''
    };
    this.mostrarModalCrear = true;
    this.cdr.detectChanges();
  }

  async guardarNuevoMedicamento() {
    if (!this.nuevoMedicamento.nombreComercial || !this.nuevoMedicamento.nombreComercial.trim()) {
      this.lanzarNotificacion('El nombre comercial del medicamento es obligatorio.', 'warning');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges(); // Renderiza el spinner de inmediato

    try {
      await firstValueFrom(this.usersService.crearMedicamento(this.nuevoMedicamento));
      await this.cargarMedicamentos();
      this.cerrarModal();
      this.lanzarNotificacion('¡Éxito! El medicamento ha sido registrado correctamente.', 'success');
    } catch (error) {
      console.error('Error al guardar medicamento en componente:', error);
      this.lanzarNotificacion('No se pudo registrar el medicamento. Revisa la consola.', 'error');
    } finally {
      // Garantiza que el botón se libere pase lo que pase en la solicitud HTTP
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  abrirEliminar() {
    if (!this.medicamentoSeleccionado) {
      this.lanzarNotificacion('Selecciona un medicamento de la tabla primero.', 'warning');
      return;
    }
    this.mostrarModalDelete = true;
    this.cdr.detectChanges();
  }

  async confirmarEliminar() {
    if (!this.medicamentoSeleccionado) return;
    this.isDeleting = true;
    this.cdr.detectChanges();

    try {
      const id = this.medicamentoSeleccionado.IdMedicamento || this.medicamentoSeleccionado.idmedicamento || this.medicamentoSeleccionado.id;
      await firstValueFrom(this.usersService.eliminarMedicamento(id));
      await this.cargarMedicamentos();
      this.cerrarModal();
      this.medicamentoSeleccionado = null;
      this.lanzarNotificacion('El medicamento ha sido eliminado.', 'success');
    } catch (error) {
      console.error('Error al eliminar en componente:', error);
      this.lanzarNotificacion('No se pudo eliminar el medicamento debido a dependencias en la base de datos.', 'error');
    } finally {
      this.isDeleting = false;
      this.cdr.detectChanges();
    }
  }

  cerrarModal() {
    this.mostrarModalCrear = false;
    this.mostrarModalDelete = false;
    this.cdr.detectChanges();
  }
}