import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GoogleService } from '../../../../auth/services/google';
import { Users } from '../../../../auth/services/users';
import { firstValueFrom } from 'rxjs';
import { Menu } from "../../../template/menu/menu";
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

@Component({
  selector: 'app-acompanante-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, Menu],
  templateUrl: './acompanante-detalle.html',
  styleUrls: ['./acompanante-detalle.css']
})
export class AcompananteDetalle implements OnInit, AfterViewInit {
  private router = inject(Router);
  private location = inject(Location);
  private googleService = inject(GoogleService);
  private usersService = inject(Users);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  usuarioSeleccionado: any = null;
  isSaving = false;

  ngOnInit() {
    let state: any = null;
    if (isPlatformBrowser(this.platformId)) {
      state = history.state;
    } else {
      const navigation = this.router.getCurrentNavigation();
      state = navigation?.extras?.state;
    }

    if (state && state.usuario) {
      this.usuarioSeleccionado = { ...state.usuario };

      // Limpiamos formatos ISO raros provenientes del GET de Postgres
      if (this.usuarioSeleccionado.fechaNacimiento) {
        this.usuarioSeleccionado.fechaNacimiento = this.limpiarFecha(this.usuarioSeleccionado.fechaNacimiento);
      }
      if (this.usuarioSeleccionado.fechaAsignacion) {
        this.usuarioSeleccionado.fechaAsignacion = this.limpiarFecha(this.usuarioSeleccionado.fechaAsignacion);
      }
    } else {
      this.router.navigate(['/acompanantes']);
    }
  }

  ngAfterViewInit() {
    // Inicializar el calendario en cuanto el DOM esté listo de forma automática
    this.inicializarCalendario();
  }

  limpiarFecha(fecha: any): string {
    if (!fecha) return '';
    if (typeof fecha === 'string') {
      return fecha.includes('T') ? fecha.split('T')[0] : fecha;
    }
    return new Date(fecha).toISOString().split('T')[0];
  }

  volver() {
    this.location.back();
  }

  async guardarCambios() {
    if (!this.usuarioSeleccionado) return;

    const id = this.usuarioSeleccionado.idusuario || this.usuarioSeleccionado.id || this.usuarioSeleccionado.uid;
    if (!id) {
      alert("Error: No se encontró el ID del usuario. Vuelva a la lista e intente de nuevo.");
      return;
    }

    this.isSaving = true;

    try {
      const payload = {
        nombre: (this.usuarioSeleccionado.nombre || '').trim(),
        apPaterno: (this.usuarioSeleccionado.apPaterno || '').trim(),
        apMaterno: (this.usuarioSeleccionado.apMaterno || '').trim(),
        correo: (this.usuarioSeleccionado.correo || '').trim(),
        telefono: (this.usuarioSeleccionado.telefono || '').trim(),
        genero: this.usuarioSeleccionado.genero,
        activo: this.usuarioSeleccionado.activo,
        rol: this.usuarioSeleccionado.rol || 'Acompañante',
        fechaNacimiento: this.usuarioSeleccionado.fechaNacimiento,
        fechaAsignacion: this.usuarioSeleccionado.fechaAsignacion
      };

      if (!payload.fechaNacimiento || !payload.fechaAsignacion) {
        alert("Error: La fecha de nacimiento y la fecha de asignación son campos obligatorios.");
        this.isSaving = false;
        return;
      }

      await firstValueFrom(this.usersService.updateUsuario(id, payload));

      // MENSAJE REMOVIDO: Regresa directo sin interrumpir con la alerta nativa
      this.volver();

    } catch (error: any) {
      console.error("Error al guardar cambios:", error);
      alert("Hubo un error al guardar los cambios: " + (error.error?.error || error.message));
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  inicializarCalendario() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const hoy = new Date();
        const fechaMaxima = new Date(hoy.getFullYear(), hoy.getMonth() + 2, hoy.getDate());

        const config: any = {
          locale: Spanish,
          dateFormat: "Y-m-d",
          defaultDate: this.usuarioSeleccionado?.fechaAsignacion || "today",
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

        flatpickr('#fechaInput', config);
      }, 50);
    }
  }
}