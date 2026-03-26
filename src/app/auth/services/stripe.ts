import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Stripe {

  // Reemplaza con tu pk_test_... real
  private stripePromise = loadStripe(environment.stripePublicKey);
  private apiUrl = environment.checkoutApi;

  constructor(private http: HttpClient) { }

  async redirectToCheckout(plan: 'PRO' | 'BASIC', userId: string) {
    // Ya no necesitamos 'stripeInstance.redirectToCheckout'

    this.http.post<{ url: string }>(this.apiUrl, {
      uid: userId,
      planType: plan
    }).subscribe({
      next: (response) => {
        // La forma moderna: simplemente redirigir a la URL que creó el backend
        if (response.url) {
          window.location.href = response.url;
        }
      },
      error: (err) => {
        console.error('Error al conectar con el servidor:', err);
        alert('Error al conectar con el servidor. ¿Está encendido el Backend?');
      }
    });
  }
}