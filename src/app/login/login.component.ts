import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/dashboard', '1']);
    }
  }

  submit(form: NgForm): void {
    this.error = null;

    if (form.invalid) {
      this.error = 'Revisa los campos marcados en rojo.';
      return;
    }

    this.loading = true;
    this.error = null;

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard', '1']);
      },
      error: (err) => {
        this.loading = false;
        const backendMessage = err?.error?.error;
        this.error = backendMessage || 'No se pudo iniciar sesión';
      }
    });
  }

  loginWithGoogle(): void {
    // El backend maneja el OAuth y setea la cookie HttpOnly del refresh token.
    window.location.href = 'http://localhost:3000/api/auth/google';
  }
}

