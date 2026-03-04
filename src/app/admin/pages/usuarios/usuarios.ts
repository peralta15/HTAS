import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu } from "../../template/menu/menu";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [Menu, CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios {
  usuariosTodo = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    nombre: `Usuario ${i + 1}`,
    correo: `usuario${i + 1}@htas.com`,
    rol: i % 3 === 0 ? 'Médico' : i % 3 === 1 ? 'Paciente' : 'Acompañante',
    dispositivo: 'Pulsera Presión Arterial v2',
    activo: i % 4 !== 0
  }));

  // Paginación
  paginaActual = 0;
  itemsPorPagina = 10;

  // Selección y Modal
  usuarioSeleccionado: any = null;
  mostrarModalEdit = false;

  get usuariosPaginados() {
    const inicio = this.paginaActual * this.itemsPorPagina;
    return this.usuariosTodo.slice(inicio, inicio + this.itemsPorPagina);
  }

  cambiarPagina(delta: number) {
    const nuevaPagina = this.paginaActual + delta;
    if (nuevaPagina >= 0 && nuevaPagina * this.itemsPorPagina < this.usuariosTodo.length) {
      this.paginaActual = nuevaPagina;
      this.usuarioSeleccionado = null; // Limpiar selección al cambiar de página
    }
  }

  seleccionar(u: any) {
    this.usuarioSeleccionado = u;
  }

  abrirEditar() {
    this.mostrarModalEdit = true;
  }

  eliminar() {
    if (confirm(`¿Estás seguro de eliminar a ${this.usuarioSeleccionado.nombre}?`)) {
      this.usuariosTodo = this.usuariosTodo.filter(u => u.id !== this.usuarioSeleccionado.id);
      this.usuarioSeleccionado = null;
    }
  }

  cerrarModal() {
    this.mostrarModalEdit = false;
  }
}