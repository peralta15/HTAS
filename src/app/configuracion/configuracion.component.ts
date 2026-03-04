import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="configuracion-container">
      <h1 class="configuracion-title">Configuración</h1>
      <div class="breadcrumb">
        <span>Admin</span>
        <span class="separator">/</span>
        <span class="active">Configuración</span>
      </div>
      
      <div class="placeholder-card">
        <p>⚙️ Módulo de Configuración en construcción</p>
      </div>
    </div>
  `,
  styles: [`
    .configuracion-container {
      padding: 24px 0;
    }
    .configuracion-title {
      font-size: 28px;
      font-weight: 700;
      color: #2C3E50;
      margin: 0 0 8px 0;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #7F8C8D;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .breadcrumb .separator {
      color: #7F8C8D;
    }
    .breadcrumb .active {
      color: #C8102E;
      font-weight: 500;
    }
    .placeholder-card {
      background: white;
      border-radius: 12px;
      padding: 48px;
      text-align: center;
      color: #7F8C8D;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
  `]
})
export class ConfiguracionComponent {}