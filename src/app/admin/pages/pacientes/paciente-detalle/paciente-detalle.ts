import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GoogleService } from '../../../../auth/services/google';
import { Users } from '../../../../auth/services/users';
import { firstValueFrom } from 'rxjs';
import { Menu } from "../../../template/menu/menu";

@Component({
  selector: 'app-paciente-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, Menu],
  templateUrl: './paciente-detalle.html',
  styleUrls: ['./paciente-detalle.css']
})
export class PacienteDetalle implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private googleService = inject(GoogleService);
  private usersService = inject(Users);
  private cdr = inject(ChangeDetectorRef);

  usuarioSeleccionado: any = null;
  isSaving = false;

  ngOnInit() {
    const state = history.state;
    if (state && state.usuario) {
      this.usuarioSeleccionado = { ...state.usuario };
    } else {
      this.router.navigate(['/pacientes']);
    }
  }

  volver() {
    this.location.back();
  }

  async guardarCambios() {
    if (!this.usuarioSeleccionado) return;
    this.isSaving = true;
    const fuenteActual = this.usuarioSeleccionado.fuente;
    const id = this.usuarioSeleccionado.id;

    try {
      const nombre = (this.usuarioSeleccionado.tempNombre || '').trim();
      const apPaterno = (this.usuarioSeleccionado.tempApellidoPaterno || '').trim();
      const apMaterno = (this.usuarioSeleccionado.tempApellidoMaterno || '').trim();
      const nombreCompleto = [nombre, apPaterno, apMaterno].filter(p => p).join(' ');

      if (fuenteActual === 'Firebase') {
        const dataFirebase = {
          NombreCompleto: nombreCompleto,
          correo: this.usuarioSeleccionado.correo,
          rol: this.usuarioSeleccionado.rol,
          telefono: this.usuarioSeleccionado.telefono
        };
        await this.googleService.updateUsuario(id, dataFirebase);
      } else {
        const datosPostgres = {
          nombre: nombre,
          apPaterno: apPaterno,
          apMaterno: apMaterno,
          appaterno: apPaterno,
          apmaterno: apMaterno,
          correo: this.usuarioSeleccionado.correo,
          telefono: this.usuarioSeleccionado.telefono,
          nss: this.usuarioSeleccionado.nss,
          rol: 'Paciente',
          activo: this.usuarioSeleccionado.activo ?? true
        };
        await firstValueFrom(this.usersService.updateUsuario(id, datosPostgres));
      }

      console.log('Cambios guardados exitosamente');
      this.router.navigate(['/pacientes']);

    } catch (error: any) {
      console.error('Error al actualizar:', error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }
}
