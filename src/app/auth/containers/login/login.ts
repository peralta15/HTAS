import { Component, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { soloLetrasValidator, soloLetras } from '../../../validations/validators';
import { GoogleService } from '../../services/google';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Headermenu } from "../../../template/headermenu/headermenu";
import { Footer } from "../../../template/footer/footer";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    Headermenu,
    Footer
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

  isToggled = false;
  registerForm: FormGroup;
  loading = false;

  esperandoPin = false;
  pinIngresado = '';
  pinCorrectoBD = '';
  usuarioUidTemporal = ''; // Para saber a quién actualizar el pinVerificado

  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalIcon = '';
  modalType: 'modal-success' | 'modal-error' = 'modal-success';

  constructor() {
    this.registerForm = this.fb.group({
      NombreCompleto: ['', [Validators.required, Validators.maxLength(100), soloLetrasValidator()]],
      Telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      Rol: ['', [Validators.required]],
      Activo: [true]
    });
  }

  toggleToSignUp() { this.isToggled = true; }
  toggleToSignIn() { this.isToggled = false; this.esperandoPin = false; }

  async onSubmitSignUp() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.cdr.detectChanges();
      const generadoPin = Math.floor(100000 + Math.random() * 900000).toString();

      try {
        await this.googleService.registerWithGoogle({ ...this.registerForm.value, pin: generadoPin });
        this.ngZone.run(() => {
          this.loading = false;
          this.openModal('¡Registro Exitoso!', `Cuenta creada. Revisa tu correo para obtener tu PIN de acceso único.`, 'modal-success');
          this.cdr.detectChanges();
        });
      } catch (error: any) {
        this.ngZone.run(() => {
          this.loading = false;
          this.openModal('Error al Registrar', error.message, 'modal-error');
        });
      }
    }
  }

  async onLoginWithGoogle() {
    this.loading = true;
    this.cdr.detectChanges();

    try {
      const datosUsuario = await this.googleService.loginWithGoogle();
      this.ngZone.run(() => {
        this.loading = false;

        // REVISIÓN DE SEGURIDAD: ¿Ya verificó el PIN antes?
        if (datosUsuario['pinVerificado'] === true) {
          // Si ya lo hizo, entra directo
          this.router.navigate(['/recursos']);
        } else {
          // Si es su primer login tras el registro, pide el PIN
          this.usuarioUidTemporal = datosUsuario['uid'];
          this.pinCorrectoBD = datosUsuario['pin'];
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
        // Marcamos en la BD que ya no se le pida más el PIN
        await this.googleService.marcarPinComoVerificado(this.usuarioUidTemporal);

        this.openModal('Verificado', 'Identidad confirmada. Bienvenido a HTAS.', 'modal-success');
        setTimeout(() => {
          this.ngZone.run(() => this.router.navigate(['/recursos']));
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
}