import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GoogleService } from '../../../../auth/services/google';
import { Users } from '../../../../auth/services/users';
import { firstValueFrom } from 'rxjs';
import { Menu } from "../../../template/menu/menu";

@Component({
  selector: 'app-medico-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, Menu],
  templateUrl: './medico-detalle.html',
  styleUrls: ['./medico-detalle.css']
})
export class MedicoDetalle implements OnInit, OnDestroy {
  private router = inject(Router);
  private location = inject(Location);
  private googleService = inject(GoogleService);
  private usersService = inject(Users);
  private cdr = inject(ChangeDetectorRef);

  usuarioSeleccionado: any = null;
  isSaving = false;

  // Sistema de Notificaciones Premium Toast
  mostrarToast = false;
  mensajeToast = '';
  tipoToast: 'success' | 'error' | 'warning' = 'success';
  private toastTimeout: any = null;

  ngOnInit() {
    const state = history.state;
    if (state && state.usuario) {
      this.usuarioSeleccionado = { ...state.usuario };
    } else {
      this.router.navigate(['/medicos']);
    }
  }

  ngOnDestroy() {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  volver() {
    this.location.back();
  }

  // Controlador de disparo para el Toast Premium
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

  async guardarCambios() {
    if (!this.usuarioSeleccionado) return;

    const nombre = (this.usuarioSeleccionado.tempNombre || '').trim();
    const apPaterno = (this.usuarioSeleccionado.tempApellidoPaterno || '').trim();
    const correoFinal = this.usuarioSeleccionado.correo || this.usuarioSeleccionado.Correo;

    // Validación de campos mandatorios
    if (!nombre || !apPaterno || !correoFinal) {
      this.lanzarNotificacion("El nombre, apellido paterno y correo electrónico son requeridos.", "warning");
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    try {
      const apMaterno = (this.usuarioSeleccionado.tempApellidoMaterno || '').trim();
      const nombreCompleto = [nombre, apPaterno, apMaterno].filter(p => p).join(' ');

      const datosActualizados = {
        nombre: nombre,
        apPaterno: apPaterno,
        apMaterno: apMaterno,
        NombreCompleto: nombreCompleto,
        correo: correoFinal,
        telefono: this.usuarioSeleccionado.telefono || 'Sin teléfono',
        especialidad: this.usuarioSeleccionado.especialidad || 'General',
        direccionClinica: this.usuarioSeleccionado.direccionClinica || 'No registrada',
        rol: this.usuarioSeleccionado.rol || 'Médico'
      };

      const idFinal = this.usuarioSeleccionado.idusuario || this.usuarioSeleccionado.id;

      if (this.usuarioSeleccionado.fuente === 'Firebase') {
        await this.googleService.updateUsuario(idFinal, datosActualizados);
      } else {
        await firstValueFrom(this.usersService.updateUsuario(idFinal, datosActualizados));
      }

      this.lanzarNotificacion("¡Éxito! Los datos del médico se actualizaron correctamente.", "success");

      // Redirección diferida para permitir la visualización de la confirmación
      setTimeout(() => {
        this.router.navigate(['/medicos']);
      }, 2000);

    } catch (error) {
      console.error('Error detallado al guardar:', error);
      this.lanzarNotificacion("No se pudieron guardar los cambios en el servidor.", "error");
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }
}