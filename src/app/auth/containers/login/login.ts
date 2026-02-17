import { Component, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { soloLetrasValidator, soloLetras } from '../../../validations/validators';
import { GoogleService } from '../../services/google';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Headermenu } from "../../../template/headermenu/headermenu";
import { Breadcrumbs } from "../../../pages/breadcrumbs/breadcrumbs";
import { Footer } from "../../../template/footer/footer";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Headermenu,
    Breadcrumbs,
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

  // Propiedades para el modal de avisos
  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalIcon = '';
  modalType: 'modal-success' | 'modal-error' = 'modal-success';

  constructor() {
    // Formulario de registro (SIN correo ni contraseña, Google los dará)
    this.registerForm = this.fb.group({
      NombreCompleto: ['', [Validators.required, Validators.maxLength(100), soloLetrasValidator()]],
      Telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      Rol: ['', [Validators.required]],
      Activo: [true]
    });
  }

  // Alternar entre vistas
  toggleToSignUp() { this.isToggled = true; }
  toggleToSignIn() { this.isToggled = false; }

  // Lógica de REGISTRO
  async onSubmitSignUp() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.cdr.detectChanges();

      try {
        await this.googleService.registerWithGoogle(this.registerForm.value);
        this.ngZone.run(() => {
          this.loading = false;
          this.router.navigate(['/recursos']);
          this.cdr.detectChanges();
        });
      } catch (error: any) {
        // Force the execution to be handled by Angular instantly
        setTimeout(() => {
          this.ngZone.run(() => {
            this.loading = false;
            this.openModal(
              'Error al Registrar',
              error.message || 'Hubo un problema al vincular tu cuenta de Google.',
              'modal-error'
            );
            this.cdr.detectChanges();
          });
        }, 0);
      }
    }
  }

  // Lógica de LOGIN
  async onLoginWithGoogle() {
    this.loading = true;
    this.cdr.detectChanges();

    try {
      await this.googleService.loginWithGoogle();
      this.ngZone.run(() => {
        this.loading = false;
        this.router.navigate(['/recursos']);
        this.cdr.detectChanges();
      });
    } catch (error: any) {
      // Definitive fix for async rendering delay
      setTimeout(() => {
        this.ngZone.run(() => {
          this.loading = false;
          this.openModal(
            'Acceso Denegado',
            error.message || 'Cuenta no registrada.',
            'modal-error'
          );
          this.cdr.detectChanges();
        });
      }, 0);
    }
  }

  // Utilidades para el formulario
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
    this.cdr.detectChanges(); // Force UI update instantly
  }

  closeModal() { this.showModal = false; }
}