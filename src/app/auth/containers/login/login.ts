import { Component, inject, ChangeDetectorRef, NgZone, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { soloLetrasValidator, soloLetras } from '../../../validations/validators';
import { GoogleService } from '../../services/google';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private googleService = inject(GoogleService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  isToggled = false;
  registerForm: FormGroup;
  loading = false;

  esperandoPin = false;
  pinIngresado = '';
  pinCorrectoBD = '';
  usuarioUidTemporal = '';

  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalIcon = '';
  modalType: 'modal-success' | 'modal-error' = 'modal-success';

  // Variables del calendario
  fechaMinima: string = '';
  fechaMaxima: string = '';

  constructor() {
    this.registerForm = this.fb.group({
      NombreCompleto: ['', [Validators.required, Validators.maxLength(100), soloLetrasValidator()]],
      Telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      Rol: ['', [Validators.required]],
      Cedula: [''],
      Especialidad: [''],
      DireccionClinica: [''],
      FechaAsignacion: [''],
      Activo: [true]
    });

    this.registerForm.get('Rol')?.valueChanges.subscribe(rol => {
      this.actualizarValidacionesDinamicas(rol);
    });

    this.configurarLimitesFecha();
  }

  private configurarLimitesFecha() {
    const hoy = new Date();
    this.fechaMinima = hoy.toISOString().split('T')[0];
    // Límite de 3 meses para la fecha máxima
    const maxFecha = new Date(hoy.getFullYear(), hoy.getMonth() + 3, 0);
    this.fechaMaxima = maxFecha.toISOString().split('T')[0];
    this.registerForm.patchValue({ FechaAsignacion: this.fechaMinima });
  }

  private actualizarValidacionesDinamicas(rol: string) {
    const doctorFields = ['Cedula', 'Especialidad', 'DireccionClinica'];
    const acompananteFields = ['FechaAsignacion'];

    doctorFields.forEach(fieldName => {
      const control = this.registerForm.get(fieldName);
      if (rol === 'Doctor') {
        control?.setValidators([Validators.required]);
      } else {
        control?.clearValidators();
        control?.setValue('');
      }
      control?.updateValueAndValidity();
    });

    acompananteFields.forEach(fieldName => {
      const control = this.registerForm.get(fieldName);
      if (rol === 'Acompañante') {
        control?.setValidators([Validators.required]);
      } else {
        control?.clearValidators();
        control?.setValue('');
      }
      control?.updateValueAndValidity();
    });
  }

  async onSubmitSignUp() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.cdr.detectChanges();

      const f = this.registerForm.value;
      const generadoPin = Math.floor(100000 + Math.random() * 900000).toString();

      let datosUsuario: any = {
        nombre: f.NombreCompleto || '',
        telefono: f.Telefono || '',
        rol: f.Rol || '',
        activo: true,
        pin: generadoPin,
        pinVerificado: false
      };

      if (f.Rol === 'Doctor') {
        datosUsuario.cedula = f.Cedula || '';
        datosUsuario.especialidad = f.Especialidad || '';
        datosUsuario.direccionClinica = f.DireccionClinica || '';
      } else if (f.Rol === 'Acompañante') {
        datosUsuario.fechaAsignacion = f.FechaAsignacion || '';
      }

      try {
        await this.googleService.registerWithGoogle(datosUsuario);
        this.ngZone.run(() => {
          this.loading = false;
          this.openModal('¡Registro Exitoso!', `Cuenta creada. Revisa tu correo para tu PIN.`, 'modal-success');
          this.cdr.detectChanges();
        });
      } catch (error: any) {
        this.ngZone.run(() => {
          this.loading = false;
          this.openModal('Error al Registrar', error.message, 'modal-error');
        });
      }
    } else {
      this.openModal('Formulario Incompleto', 'Por favor revisa los campos marcados.', 'modal-error');
    }
  }

  async onLoginWithGoogle() {
    this.loading = true;
    this.cdr.detectChanges();

    try {
      // Usamos : any para evitar el error TS7053 del bundle
      const datosUsuario: any = await this.googleService.loginWithGoogle();
      this.ngZone.run(() => {
        this.loading = false;
        if (datosUsuario.pinVerificado === true) {
          this.router.navigate(['/inicio']);
        } else {
          this.usuarioUidTemporal = datosUsuario.uid;
          this.pinCorrectoBD = datosUsuario.pin;
          this.esperandoPin = true;
          this.cdr.detectChanges();
        }
      });
    } catch (error: any) {
      this.ngZone.run(() => {
        this.loading = false;
        this.openModal('Acceso Denegado', error.message, 'modal-error');
      });
    }
  }

  async verificarPin() {
    if (this.pinIngresado === this.pinCorrectoBD) {
      try {
        await this.googleService.marcarPinComoVerificado(this.usuarioUidTemporal);
        this.openModal('Verificado', 'Identidad confirmada. Bienvenido a HTAS.', 'modal-success');
        setTimeout(() => {
          this.ngZone.run(() => this.router.navigate(['/inicio']));
        }, 1500);
      } catch (e) {
        this.openModal('Error', 'No se pudo actualizar el estado de verificación.', 'modal-error');
      }
    } else {
      this.openModal('PIN Incorrecto', 'El código no coincide con el enviado a tu correo.', 'modal-error');
    }
  }

  onKeyPress(event: KeyboardEvent): boolean { return soloLetras(event); }
  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = event.key.charCodeAt(0);
    return (charCode >= 48 && charCode <= 57);
  }

  private openModal(title: string, message: string, type: 'modal-success' | 'modal-error') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.modalIcon = type === 'modal-success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-triangle-fill';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal() { this.showModal = false; }

  inicializarCalendario() {
    if (isPlatformBrowser(this.platformId)) {
      // Agregamos un pequeño delay para asegurar que el input sea visible en el DOM
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
          disableMobile: true, // Esto quita el calendario "feo" del celular
          onChange: (selectedDates: any, dateStr: string) => {
            const control = this.registerForm.get('FechaAsignacion');
            if (control) {
              control.setValue(dateStr);
              control.markAsDirty();
              control.updateValueAndValidity();
            }
            this.cdr.detectChanges();
          }
        };

        const fp = flatpickr('#fechaInput', config);

        // Verificación de seguridad para evitar el "TypeError: undefined"
        if (fp) {
          const instance = Array.isArray(fp) ? fp[0] : fp;
          if (instance && typeof instance.open === 'function') {
            instance.open();
          }
        } else {
          console.warn('No se encontró el elemento #fechaInput en el DOM');
        }
      }, 50); // 50ms son suficientes
    }
  }

  toggleToSignUp() {
    this.isToggled = true;
    setTimeout(() => {
      this.inicializarCalendario();
    }, 200);
  }

  toggleToSignIn() {
    this.isToggled = false;
    this.esperandoPin = false;
  }
}