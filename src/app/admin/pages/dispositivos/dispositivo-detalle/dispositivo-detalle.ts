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

  // Almacena el objeto clonado del dispositivo a editar o recuperar
  dispositivoSeleccionado: any = null;
  isSaving = false;

  // Catálogos homologados con el formulario general de dispositivos
  estadosDispositivo = ['Disponible', 'Operativo', 'En mantenimiento', 'Fuera de servicio'];
  tiposDispositivo = ['Monitor', 'Diagnóstico', 'Terapéutico', 'Quirúrgico', 'Rehabilitación', 'Laboratorio', 'Otro'];

  // Sistema de Notificaciones Premium Toast
  mostrarToast = false;
  mensajeToast = '';
  tipoToast: 'success' | 'error' | 'warning' = 'success';
  private toastTimeout: any = null;

  async ngOnInit() {
    let state: any = null;

    // 1. Recuperación segura del estado de navegación tanto en Browser como en SSR
    if (isPlatformBrowser(this.platformId)) {
      state = history.state;
    } else {
      const navigation = this.router.getCurrentNavigation();
      state = navigation?.extras?.state;
    }

    // Si existe el dispositivo en el state, hacemos la copia para evitar mutaciones directas
    if (state && state.dispositivo) {
      this.dispositivoSeleccionado = { ...state.dispositivo };
    } else {
      // 2. Si el usuario recargó la página (F5), recuperamos el ID desde la URL
      const idUrl = this.route.snapshot.paramMap.get('id');

      if (idUrl) {
        try {
          // Reutilizamos el método existente para traer todos y buscamos el correspondiente
          const todos = await firstValueFrom(this.usersService.getDispositivos());
          const encontrado = todos?.find((d: any) =>
            String(d.iddispositivo || d.idDispositivo || d.id) === String(idUrl)
          );

          if (encontrado) {
            this.dispositivoSeleccionado = { ...encontrado };
            this.cdr.detectChanges();
          } else {
            // Si el ID no pertenece a ningún dispositivo real, saca al usuario
            this.router.navigate(['/dispositivos']);
          }
        } catch (error) {
          console.error("No se pudo recuperar la lista al recargar con F5:", error);
          this.router.navigate(['/dispositivos']);
        }
      } else {
        // Redirección de seguridad si no hay state ni ID en la URL
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

  // Lanzador global de alertas Toast Premium
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

    // Validación unificada del ID primario del dispositivo
    const id = this.dispositivoSeleccionado.iddispositivo || this.dispositivoSeleccionado.id;
    if (!id) {
      this.lanzarNotificacion("Error: No se encontró el identificador único del dispositivo.", "error");
      return;
    }

    const nombre = (this.dispositivoSeleccionado.nombre || '').trim();
    if (!nombre) {
      this.lanzarNotificacion("El nombre del dispositivo es un campo obligatorio.", "warning");
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    try {
      // Estructura limpia del Payload mapeado listo para tu API
      const payload = {
        nombre: nombre,
        descripcion: (this.dispositivoSeleccionado.descripcion || '').trim(),
        modelo: (this.dispositivoSeleccionado.modelo || '').trim(),
        serie: (this.dispositivoSeleccionado.serie || '').trim(),
        tipo: this.dispositivoSeleccionado.tipo || 'Monitor',
        estado: this.dispositivoSeleccionado.estado || 'Disponible'
      };

      // Consumo síncrono del servicio mediante RxJS firstValueFrom
      await firstValueFrom(this.usersService.actualizarDispositivo(id, payload));

      this.lanzarNotificacion("¡Dispositivo actualizado con éxito!", "success");

      // Redirección diferida para permitir la visualización del Toast de éxito
      setTimeout(() => {
        this.router.navigate(['/dispositivos']);
      }, 1500);

    } catch (error: any) {
      console.error("Error al guardar cambios en el dispositivo:", error);
      const msgErr = error.error?.error || error.message || "Error interno en el servidor.";
      this.lanzarNotificacion(`No se pudo guardar: ${msgErr}`, "error");
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }
}