import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertItem } from '../../services/dashboard';

@Component({
  selector: 'app-alerts-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alerts-container">
      <h2>Alertas activas <span class="badge">{{ alerts.length }}</span></h2>
      
      <div class="alerts-list" *ngIf="alerts.length > 0">
        <div *ngFor="let alert of alerts" 
             class="alert-item"
             [ngClass]="'severity-' + (alert.severity || 'low')">
          
          <div class="alert-icon">
            {{ getAlertIcon(alert.severity) }}
          </div>
          
          <div class="alert-content">
            <div class="alert-header">
              <span class="alert-title">{{ alert.title || alert.type || 'Alerta' }}</span>
              <span class="alert-time">{{ alert.timestamp | date:'HH:mm, dd/MM' }}</span>
            </div>
            <p class="alert-message">{{ alert.message || 'Sin descripción' }}</p>
            <span class="alert-code" *ngIf="alert.code">{{ alert.code }}</span>
          </div>
          
          <button class="alert-resolve" (click)="onResolve.emit(alert)" 
                  *ngIf="alert.status === 'active'">
            ✓
          </button>
        </div>
      </div>

      <div class="no-alerts" *ngIf="alerts.length === 0">
        <p>No hay alertas activas</p>
      </div>
    </div>
  `,
  styles: [`
    .alerts-container {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .alerts-container h2 {
      margin: 0 0 20px 0;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge {
      background: #F44336;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .alert-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid transparent;
      transition: all 0.3s ease;
    }
    .alert-item:hover {
      background: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .severity-critical {
      border-left-color: #F44336;
    }
    .severity-high {
      border-left-color: #FF9800;
    }
    .severity-medium {
      border-left-color: #FFC107;
    }
    .severity-low {
      border-left-color: #2E5BFF;
    }
    .alert-icon {
      font-size: 24px;
      min-width: 40px;
      text-align: center;
    }
    .alert-content {
      flex: 1;
    }
    .alert-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .alert-title {
      font-weight: 600;
      color: #333;
    }
    .alert-time {
      font-size: 12px;
      color: #999;
    }
    .alert-message {
      color: #666;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .alert-code {
      font-size: 11px;
      color: #999;
      background: #eee;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .alert-resolve {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: #4CAF50;
      color: white;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .alert-item:hover .alert-resolve {
      opacity: 1;
    }
    .no-alerts {
      padding: 40px;
      text-align: center;
      color: #999;
      background: #f8f9fa;
      border-radius: 8px;
    }
  `]
})
export class AlertsList {
  @Input() alerts: AlertItem[] = [];
  @Output() onResolve = new EventEmitter<AlertItem>();

  getAlertIcon(severity?: string): string {
    const icons: Record<string, string> = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🔵'
    };
    return icons[severity || ''] || '⚪';
  }
}