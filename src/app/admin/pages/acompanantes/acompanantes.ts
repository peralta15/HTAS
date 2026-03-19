import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Menu } from "../../template/menu/menu";
import { FormsModule } from '@angular/forms';
import { GoogleService } from '../../../auth/services/google';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import { Users } from '../../../auth/services/users';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-acompanantes',
  imports: [Menu, CommonModule, FormsModule],
  templateUrl: './acompanantes.html',
  styleUrl: './acompanantes.css',
})
export class Acompanantes implements OnInit {
  private googleService = inject(GoogleService);
  private usersService = inject(Users);
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
    if (isPlatformBrowser(this.platformId)) {
      await this.cargarUsuarios();
    }
  }

  async cargarUsuarios() {
    try {
      // 1. Obtenemos datos de ambas fuentes
      const usersFirebase = await this.googleService.getUsuarios();
      const usersBackend = await firstValueFrom(this.usersService.getUsuariosBackend());

      // 2. Normalizamos Firebase (Aseguramos que tenga los campos que el HTML usa)
      const firebaseNormalizado = usersFirebase.map(u => ({
        ...u,
        id: u.id || u.uid,
        // Usamos NombreCompleto o nombre (lo que traiga Google)
        NombreCompleto: u.NombreCompleto || u.nombre || 'Usuario de Google',
        correo: u.correo || u.email,
        rol: u.rol || u.Rol || 'Acompañante',
        fuente: 'Firebase'
      }));

      // 3. Normalizamos Backend (Mapeamos los campos de tu DB de Postgres)
      const backendNormalizado = usersBackend.map(u => ({
        ...u,
        id: u.idusuario || u.uid_firebase || u.id,
        // Construimos el nombre completo desde las piezas del backend
        NombreCompleto: u.NombreCompleto || `${u.nombre || ''} ${u.apPaterno || ''} ${u.apMaterno || ''}`.trim() || 'Usuario Backend',
        correo: u.correo,
        rol: u.rol || 'Acompañante',
        telefono: u.telefono || 'Sin teléfono',
        fuente: 'Postgres'
      }));

      // 4. Combinamos y filtramos
      const listaTotal = [...firebaseNormalizado, ...backendNormalizado];

      // Filtro flexible: acepta 'Acompañante' o 'acompañante'
      this.usuariosTodo = listaTotal.filter(u =>
        (u.rol || u.Rol || '').toLowerCase() === 'acompañante'
      );

      console.log('Usuarios cargados:', this.usuariosTodo); // Para que veas en consola si llegaron datos
      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error al unificar usuarios:', error);
    }
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
      // 1. Extraemos los datos necesarios
      const id = this.usuarioSeleccionado.id;
      const fuente = this.usuarioSeleccionado.fuente;

      // 2. Reconstruimos los nombres desde los campos temporales del modal
      const nombre = (this.usuarioSeleccionado.tempNombre || '').trim();
      const apPaterno = (this.usuarioSeleccionado.tempApellidoPaterno || '').trim();
      const apMaterno = (this.usuarioSeleccionado.tempApellidoMaterno || '').trim();
      const nombreCompleto = [nombre, apPaterno, apMaterno].filter(p => p).join(' ');

      // 3. Lógica de guardado según la FUENTE
      if (fuente === 'Firebase') {
        console.log(`Actualizando ID ${id} en Firebase...`);

        // Preparamos el objeto EXACTO que espera Firestore
        const dataFirebase = {
          NombreCompleto: nombreCompleto,
          correo: this.usuarioSeleccionado.correo,
          rol: this.usuarioSeleccionado.rol,
          telefono: this.usuarioSeleccionado.telefono
        };

        await this.googleService.updateUsuario(id, dataFirebase);

      } else {
        console.log(`Actualizando ID ${id} en Postgres...`);

        // Preparamos el objeto EXACTO que espera tu API de Node.js
        const datosPostgres = {
          nombre: nombre,
          apPaterno: apPaterno,
          apMaterno: apMaterno,
          correo: this.usuarioSeleccionado.correo,
          telefono: this.usuarioSeleccionado.telefono,
          activo: true
        };

        await firstValueFrom(this.usersService.updateUsuario(id, datosPostgres));
      }

      // 4. Sincronizamos la vista local (lo que ves en la tabla)
      const index = this.usuariosTodo.findIndex(u => u.id === id);
      if (index !== -1) {
        this.usuariosTodo[index] = {
          ...this.usuarioSeleccionado,
          NombreCompleto: nombreCompleto,
          nombre: nombre,
          apPaterno: apPaterno,
          apMaterno: apMaterno
        };
      }

      console.log(`¡Cambios guardados con éxito en ${fuente}!`);
      this.cerrarModal();
      this.cdr.detectChanges();

    } catch (error) {
      console.error(`Error al guardar en ${this.usuarioSeleccionado.fuente}:`, error);
      alert(`No se pudieron guardar los cambios en ${this.usuarioSeleccionado.fuente}. Revisa la consola.`);
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async confirmarEliminar() {
    if (!this.usuarioSeleccionado) return;

    this.isDeleting = true;
    const idAEliminar = this.usuarioSeleccionado.id;

    // Actualización Optimista: Quitamos de la lista visual al instante para mejor UX
    // Guardamos una copia por si hay que revertir
    const usuariosCopia = [...this.usuariosTodo];
    this.usuariosTodo = this.usuariosTodo.filter(u => u.id !== idAEliminar);
    this.cdr.detectChanges();

    try {
      // 1. Ejecutar eliminaciones permanentes en paralelo
      console.log(`Eliminando permanentemente usuario ${idAEliminar} de Firebase y Postgres...`);

      await Promise.all([
        // Eliminación en Firebase
        this.googleService.deleteUsuario(idAEliminar),

        // Eliminación en Postgres
        firstValueFrom(this.usersService.deleteUsuario(idAEliminar))
      ]);

      console.log('Usuario eliminado permanentemente de ambas plataformas.');
      this.cerrarModal();
    } catch (error) {
      console.error('Error crítico al eliminar en Firebase o Postgres:', error);
      alert('Hubo un error al intentar eliminar el usuario permanentemente. La operación puede haber fallado en una plataforma.');

      // Revertir la actualización optimista si falló
      this.usuariosTodo = usuariosCopia;
    } finally {
      this.isDeleting = false;
      this.usuarioSeleccionado = null;
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
