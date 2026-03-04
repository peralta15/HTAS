import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quick-actions">
      <h2>Acciones rápidas</h2>
      
      <div class="actions-grid">
        <button class="action-card" (click)="onAction.emit('open-messaging')">
          <span class="action-icon">💬</span>
          <span class="action-label">Abrir mensajería</span>
          <span class="action-desc">Contacta con el equipo médico</span>
        </button>
        
        <button class="action-card" (click)="onAction.emit('schedule-visit')">
          <span class="action-icon">📅</span>
          <span class="action-label">Programar visita</span>
          <span class="action-desc">Agenda una cita de seguimiento</span>
        </button>
        
        <button class="action-card" (click)="onAction.emit('view-reports')">
          <span class="action-icon">📊</span>
          <span class="action-label">Ver reportes</span>
          <span class="action-desc">Análisis detallado</span>
        </button>
        
        <button class="action-card" (click)="onAction.emit('emergency')">
          <span class="action-icon">🚨</span>
          <span class="action-label">Emergencia</span>
          <span class="action-desc">Contactar servicios médicos</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .quick-actions {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .quick-actions h2 {
      margin: 0 0 20px 0;
      font-size: 18px;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    .action-card {
      background: white;
      border: 2px solid #eee;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .action-card:hover {
      border-color: #2E5BFF;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(46, 91, 255, 0.2);
    }
    .action-card:active {
      transform: translateY(0);
    }
    .action-icon {
      font-size: 24px;
    }
    .action-label {
      font-weight: 600;
      color: #333;
      font-size: 16px;
    }
    .action-desc {
      font-size: 12px;
      color: #999;
    }
    @media (max-width: 768px) {
      .actions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class QuickActions {
  @Output() onAction = new EventEmitter<string>();
}