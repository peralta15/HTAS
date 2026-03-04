import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="charts-container">
      <!-- Mensaje cuando no hay datos -->
      <div *ngIf="!hasData" class="no-data">
        <p>No hay datos de signos vitales.</p>
      </div>

      <!-- Tendencia de presión arterial -->
      <div *ngIf="bloodPressureTrend && bloodPressureTrend.length > 0" class="chart-card">
        <h4>Tendencia de presión arterial (30 días)</h4>
        <div class="trend-list">
          <div *ngFor="let reading of bloodPressureTrend | slice:-7" class="trend-item">
            <span class="value">{{ reading.systolic }}/{{ reading.diastolic }}</span>
            <span class="date">{{ reading.timestamp | date:'dd/MM' }}</span>
          </div>
        </div>
      </div>

      <!-- Adherencia a medicación -->
      <div *ngIf="adherencePercentage !== undefined && adherencePercentage !== null" class="chart-card">
        <h4>Adherencia a medicación</h4>
        <div class="adherence-circle">
          <div class="circle-progress" [style.--percent]="adherencePercentage">
            <span class="circle-value">{{ adherencePercentage }}%</span>
          </div>
          <p>últimos 7 días</p>
        </div>
      </div>

      <!-- Frecuencia de mediciones -->
      <div *ngIf="measurementsFrequency" class="chart-card">
        <h4>Frecuencia de mediciones</h4>
        <div class="frequency-stats">
          <div class="stat">
            <span class="stat-value">{{ measurementsFrequency.daily || 0 }}</span>
            <span class="stat-label">hoy</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ measurementsFrequency.weekly || 0 }}</span>
            <span class="stat-label">esta semana</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .charts-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .chart-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e9ecef;
    }
    .chart-card h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #495057;
      font-weight: 600;
    }
    .trend-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .trend-item {
      background: white;
      border-radius: 6px;
      padding: 8px 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      text-align: center;
      flex: 1 1 auto;
      min-width: 70px;
    }
    .trend-item .value {
      display: block;
      font-weight: 700;
      font-size: 16px;
      color: #212529;
    }
    .trend-item .date {
      font-size: 11px;
      color: #868e96;
    }
    .adherence-circle {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
    }
    .circle-progress {
      --percent: 0;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: conic-gradient(#51cf66 0% calc(var(--percent) * 1%), #dee2e6 calc(var(--percent) * 1%) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .circle-value {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      color: #212529;
    }
    .frequency-stats {
      display: flex;
      justify-content: space-around;
      text-align: center;
    }
    .stat .stat-value {
      display: block;
      font-size: 28px;
      font-weight: 700;
      color: #339af0;
    }
    .stat .stat-label {
      font-size: 12px;
      color: #868e96;
      text-transform: uppercase;
    }
    .no-data {
      padding: 32px;
      text-align: center;
      color: #868e96;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px dashed #dee2e6;
    }
  `]
})
export class Charts implements OnInit {
  @Input() bloodPressureTrend: any[] | null | undefined = [];
  @Input() adherencePercentage: number | null | undefined = null;
  @Input() measurementsFrequency: { daily?: number; weekly?: number } | null | undefined = null;

  get hasData(): boolean {
    return !!(
      (this.bloodPressureTrend && this.bloodPressureTrend.length > 0) ||
      this.adherencePercentage !== undefined || 
      this.adherencePercentage !== null ||
      this.measurementsFrequency
    );
  }

  ngOnInit(): void {
    console.log('📊 Charts component initialized:', {
      bloodPressureTrend: this.bloodPressureTrend,
      adherencePercentage: this.adherencePercentage,
      measurementsFrequency: this.measurementsFrequency
    });
  }
}