import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { soloLetrasValidator, soloLetras, soloNumerosValidator } from '../../../validations/validators';
import { AuthService } from '../../services/auth';
import { Google } from '../../services/google';
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
export class Login implements OnInit {

  loginService = inject(Google);
  Router = inject(Router);
  isToggled = false;
  loginForm: FormGroup;
  registerForm: FormGroup;
  loading = false;

  showModal = false;
  modalTitle = '';
  modalMessage = '';
  modalIcon = '';
  modalType: 'success' | 'error' | 'info' = 'success';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      Correo: ['', [Validators.required, Validators.email, Validators.maxLength(60)]],
      Contrasenia: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]]
    });

    this.registerForm = this.fb.group({
      NombreCompleto: ['', [Validators.required, Validators.maxLength(100), soloLetrasValidator()]],
      Telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$'), soloNumerosValidator(10)]],
      Correo: ['', [Validators.required, Validators.email, Validators.maxLength(60)]],
      Contrasenia: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      Rol: ['Paciente'],
      Activo: [true]
    });
  }

  onKeyPress(event: KeyboardEvent): boolean {
    return soloLetras(event);
  }

  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = event.key.charCodeAt(0);
    return (charCode >= 48 && charCode <= 57);
  }

  limitarLongitud(event: Event, maxLength: number): void {
    const input = event.target as HTMLInputElement;
    if (input.value.length > maxLength) {
      input.value = input.value.slice(0, maxLength);
      this.registerForm.get(input.name)?.setValue(input.value);
    }
  }

  ngOnInit() { }

  toggleToSignUp() { this.isToggled = true; }
  toggleToSignIn() { this.isToggled = false; }

  private openModal(title: string, message: string, type: 'success' | 'error' | 'info') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;

    if (type === 'success') {
      this.modalIcon = 'bi bi-check-circle-fill';
    } else if (type === 'error') {
      this.modalIcon = 'bi bi-exclamation-triangle-fill';
    } else {
      this.modalIcon = 'bi bi-info-circle-fill';
    }

    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmitSignIn() {
    if (this.loginForm.valid) {
      this.loading = true;
      const { Correo, Contrasenia } = this.loginForm.value;

      this.authService.login(Correo, Contrasenia).subscribe({
        next: (res) => {
          console.log('Login exitoso', res);
          this.loading = false;
          this.cdr.detectChanges();
          this.router.navigate(['/recursos']);
        },
        error: (err) => {
          this.loading = false;
          this.openModal(
            'Acceso Denegado',
            err.error?.message || 'Correo o contraseña incorrectos. Por favor, intente de nuevo.',
            'error'
          );
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSubmitSignUp() {
    if (this.registerForm.valid) {
      this.loading = true;
      const datosRegistro = {
        ...this.registerForm.value,
        Telefono: Number(this.registerForm.value.Telefono)
      };

      this.authService.register(datosRegistro).subscribe({
        next: () => {
          this.loading = false;
          this.cdr.detectChanges();
          this.openModal(
            '¡Registro Exitoso!',
            'Tu cuenta ha sido creada correctamente. Ya puedes iniciar sesión.',
            'success'
          );
          this.toggleToSignIn();
          this.registerForm.reset({ Rol: 'Paciente', Activo: true });
        },
        error: (err) => {
          this.loading = false;
          this.cdr.detectChanges();
          this.openModal(
            'Error al Registrar',
            err.error?.message || 'El correo o teléfono ya están en uso. Intente con otros datos.',
            'error'
          );
        }
      });
    }
  }

  onLoginWithGoogle() {
    this.loading = true;

    this.loginService.logInGoogle()
      .then((res) => {
        this.loading = false;
        this.router.navigate(['/recursos']);
      })
      .catch((err) => {
        this.loading = false;

        if (err.code === 'auth/popup-closed-by-user') {
          console.warn('El usuario cerró la ventana de Google antes de terminar.');
        } else if (err.code === 'auth/cancelled-popup-request') {
          console.warn('Se canceló la solicitud del popup (posible doble clic).');
        } else {
          this.openModal(
            'Error de Conexión',
            'Hubo un problema al conectar con Google. Inténtalo de nuevo.',
            'error'
          );
        }
      });
  }
}