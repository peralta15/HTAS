import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
export class MedicoDetalle implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private googleService = inject(GoogleService);
  private usersService = inject(Users);
  private cdr = inject(ChangeDetectorRef);

  usuarioSeleccionado: any = null;
  isSaving = false;

  ngOnInit() {
    // Recuperar usuario del estado de la ruta
    const state = history.state;
    if (state && state.usuario) {
      this.usuarioSeleccionado = { ...state.usuario };
    } else {
      // Si se recarga la página y se pierde el estado, volvemos a la lista
      this.router.navigate(['/medicos']);
    }
  }

  volver() {
    this.location.back();
  }

  async guardarCambios() {
    if (!this.usuarioSeleccionado) return;
    this.isSaving = true;

    try {
      const nombre = (this.usuarioSeleccionado.tempNombre || '').trim();
      const apPaterno = (this.usuarioSeleccionado.tempApellidoPaterno || '').trim();
      const apMaterno = (this.usuarioSeleccionado.tempApellidoMaterno || '').trim();
      const nombreCompleto = [nombre, apPaterno, apMaterno].filter(p => p).join(' ');

      const datosActualizados = {
        nombre: nombre,
        apPaterno: apPaterno,
        apMaterno: apMaterno,
        NombreCompleto: nombreCompleto,
        correo: this.usuarioSeleccionado.correo || this.usuarioSeleccionado.Correo,
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

      console.log('Cambios guardados exitosamente');
      // Redirigir de vuelta a la lista
      this.router.navigate(['/medicos']);

    } catch (error) {
      console.error('Error detallado al guardar:', error);
      alert('No se pudieron guardar los cambios. Revisa la consola.');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }
}
