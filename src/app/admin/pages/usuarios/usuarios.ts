import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu } from "../../template/menu/menu";
import { FormsModule } from '@angular/forms';
import { GoogleService } from '../../../auth/services/google';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [Menu, CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  private googleService = inject(GoogleService);
  private cdr = inject(ChangeDetectorRef);

  usuariosTodo: any[] = [];
  searchTerm: string = '';
  expandedId: string | null = null;

  // Paginación
  paginaActual = 0;
  itemsPorPagina = 10;

  // Selección y Modal
  usuarioSeleccionado: any = null;
  mostrarModalEdit = false;

  async ngOnInit() {
    await this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.googleService.getUsuarios().then(users => {
      this.usuariosTodo = users;
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
      u.correo?.toLowerCase().includes(term)
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
    this.usuarioSeleccionado = u;
  }

  toggleExpand(id: string, event: Event) {
    event.stopPropagation();
    this.expandedId = this.expandedId === id ? null : id;
  }

  abrirEditar() {
    this.mostrarModalEdit = true;
  }

  async eliminar() {
    if (confirm(`¿Estás seguro de eliminar a ${this.usuarioSeleccionado.NombreCompleto || this.usuarioSeleccionado.nombre}?`)) {
      // Implementar eliminación real si es necesario, por ahora local
      this.usuariosTodo = this.usuariosTodo.filter(u => u.id !== this.usuarioSeleccionado.id);
      this.usuarioSeleccionado = null;
    }
  }

  cerrarModal() {
    this.mostrarModalEdit = false;
  }
}