import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private token: string | null = null;

  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.token = null;
  }

  hasToken(): boolean {
    return !!this.token;
  }

  decodePayload(): any | null {
    if (!this.token) return null;
    const parts = this.token.split('.');
    if (parts.length !== 3) return null;

    try {
      let payload = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      // Asegurar padding correcto para base64
      const pad = payload.length % 4;
      if (pad) {
        payload += '='.repeat(4 - pad);
      }
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  isTokenExpired(): boolean {
    const payload = this.decodePayload();
    if (!payload?.exp) return true;
    // exp en segundos desde epoch
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec;
  }
}

