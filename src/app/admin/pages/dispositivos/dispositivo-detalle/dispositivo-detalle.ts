import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Users } from '../../../../auth/services/users';
import { firstValueFrom } from 'rxjs';
import { Menu } from "../../../template/menu/menu";

@Component({
  selector: 'app-dispositivo-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, Menu],
  templateUrl: './dispositivo-detalle.html',
  styleUrls: ['./dispositivo-detalle.css']
})
export class DispositivoDetalle implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private usersService = inject(Users);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  // Objeto unificado que interactúa con la vista
  dispositivoSeleccionado: any = null;
  isSaving = false;

  // Sistema de Notificaciones Premium Toast
  mostrarToast = false;
  mensajeToast = '';
  tipoToast: 'success' | 'error' | 'warning' = 'success';
  private toastTimeout: any = null;

  async ngOnInit() {
    let state: any = null;

    if (isPlatformBrowser(this.platformId)) {
      state = history.state;
    } else {
      const navigation = this.router.getCurrentNavigation();
      state = navigation?.extras?.state;
    }

    // 1. Intentar recuperar desde el estado de navegación de Angular
    if (state && state.dispositivo) {
      this.dispositivoSeleccionado = { ...state.dispositivo };
    } else {
      // 2. Recuperación de respaldo ante recargas físicas (F5) usando el ID de la URL
      const idUrl = this.route.snapshot.paramMap.get('id');

      if (idUrl) {
        try {
          const todos = await firstValueFrom(this.usersService.getDispositivos());
          const encontrado = todos?.find((d: any) =>
            String(d.iddispositivo) === String(idUrl)
          );

          if (encontrado) {
            this.dispositivoSeleccionado = { ...encontrado };
            this.cdr.detectChanges();
          } else {
            this.router.navigate(['/dispositivos']);
          }
        } catch (error) {
          console.error("Error al re-hidratar datos del dispositivo desde el servidor:", error);
          this.router.navigate(['/dispositivos']);
        }
      } else {
        this.router.navigate(['/dispositivos']);
      }
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
    if (!this.dispositivoSeleccionado) return;

    // Extracción limpia del ID primario usado por el Router de Angular
    const id = this.dispositivoSeleccionado.iddispositivo;
    if (!id) {
      this.lanzarNotificacion("Error interno: No se detectó el ID del dispositivo.", "error");
      return;
    }

    const nombreLimpio = (this.dispositivoSeleccionado.nombre || '').trim();
    if (!nombreLimpio) {
      this.lanzarNotificacion("El nombre del dispositivo es obligatorio.", "warning");
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    try {
      // PAYLOAD CONTROLADO: Coincide perfectamente con las llaves que desestructura tu Express
      const payload = {
        nombre: nombreLimpio,
        direccionMac: this.dispositivoSeleccionado.direccionmac || this.dispositivoSeleccionado.direccionMac,
        idPacienteAsociado: this.dispositivoSeleccionado.idpaciente || this.dispositivoSeleccionado.idPacienteAsociado || null,
        activo: !!this.dispositivoSeleccionado.activo
      };

      // Consumo de la petición PUT hacia la API
      await firstValueFrom(this.usersService.actualizarDispositivo(id, payload));

      this.lanzarNotificacion("¡Dispositivo actualizado con éxito!", "success");

      // Redirección con retraso para lucir el Toast Premium
      setTimeout(() => {
        this.router.navigate(['/dispositivos']);
      }, 1500);

    } catch (error: any) {
      console.error("Error al actualizar la tabla de dispositivos:", error);
      const msgErr = error.error?.error || error.message || "Error al procesar la actualización.";
      this.lanzarNotificacion(`Error: ${msgErr}`, "error");
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }
}