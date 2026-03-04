import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Servicios
import { DashboardService, CaregiverDashboardResponse, AlertItem } from '../services/dashboard';
import { WebsocketService, PressureUpdate, AlertUpdate, AdherenceUpdate } from '../services/websocket';

// Componentes
import { Charts } from '../components/charts/charts.component';
import { AlertsList } from '../components/alerts-list/alerts-list.component';
import { QuickActions } from '../components/quick-actions/quick-actions.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // ← SOLUCIÓN EXTREMA
  imports: [
    CommonModule,
    Charts,
    AlertsList,
    QuickActions
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  dashboard: CaregiverDashboardResponse | null = null;
  websocketConnected = false;

  private destroy$ = new Subject<void>();
  private patientId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dashboardService: DashboardService,
    private websocket: WebsocketService
  ) {}

  get activeAlertsCount(): number {
    return (this.dashboard?.alerts ?? []).filter(a => a?.status === 'active').length;
  }

  get adherenceDisplay(): string {
    const v = this.dashboard?.summary?.adherencePercentage;
    return v !== undefined && v !== null ? `${v}%` : 'Sin datos';
  }

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('patientId');
    if (!this.patientId) {
      this.error = 'Identificador del paciente no encontrado';
      this.loading = false;
      return;
    }

    this.loadDashboard(this.patientId);
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.websocket.disconnect();
  }

  private loadDashboard(patientId: string): void {
    this.loading = true;
    this.error = null;
    
    this.dashboardService.getDashboard(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboard = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'No se pudo cargar el estado del paciente';
          this.loading = false;
          console.error('Error loading dashboard:', err);
        }
      });
  }

  private setupWebSocket(): void {
    const ws = this.websocket.connect('ws://localhost/ws/notifications');
    this.websocketConnected = this.websocket.isConnected();

    ws.messages.pipe(takeUntil(this.destroy$)).subscribe(msg => {
      console.log('📨 WebSocket message:', msg);
    });

    ws.pressure.pipe(takeUntil(this.destroy$)).subscribe((update: PressureUpdate) => {
      if (!this.dashboard || update.patientId !== this.patientId) return;
      this.dashboard = {
        ...this.dashboard,
        vitals: {
          ...this.dashboard.vitals,
          bloodPressure: {
            last: {
              systolic: update.systolic,
              diastolic: update.diastolic,
              timestamp: update.timestamp
            },
            trend: [
              ...(this.dashboard.vitals?.bloodPressure?.trend || []),
              { systolic: update.systolic, diastolic: update.diastolic, timestamp: update.timestamp }
            ].slice(-30)
          }
        }
      };
    });

    ws.alerts.pipe(takeUntil(this.destroy$)).subscribe((update: AlertUpdate) => {
      if (!this.dashboard) return;
      const alerts = this.dashboard.alerts || [];
      if (update.status === 'active') {
        const newAlert: AlertItem = {
          id: update.id,
          status: update.status,
          severity: update.severity,
          timestamp: update.timestamp,
          type: 'system',
          title: this.getAlertTitle(update.severity),
          message: this.getAlertMessage(update)
        };
        this.dashboard = { ...this.dashboard, alerts: [newAlert, ...alerts] };
      } else {
        this.dashboard = {
          ...this.dashboard,
          alerts: alerts.map(a => a.id === update.id ? { ...a, status: update.status } : a)
        };
      }
    });

    ws.adherence.pipe(takeUntil(this.destroy$)).subscribe((update: AdherenceUpdate) => {
      if (!this.dashboard || update.patientId !== this.patientId) return;
      this.dashboard = {
        ...this.dashboard,
        summary: { ...this.dashboard.summary, adherencePercentage: update.adherencePercent },
        vitals: { ...this.dashboard.vitals, adherence: { last7DaysPercent: update.adherencePercent } }
      };
    });
  }

  private getAlertTitle(severity?: string): string {
    const titles = { critical: '¡ALERTA CRÍTICA!', high: 'Alerta de alta prioridad', medium: 'Alerta', low: 'Notificación' };
    return titles[severity as keyof typeof titles] || 'Alerta del sistema';
  }

  private getAlertMessage(update: AlertUpdate): string {
    if (update.id.includes('pressure')) return 'Presión arterial fuera de rango normal';
    if (update.id.includes('medication')) return 'Medicación no tomada según lo programado';
    return 'Se ha detectado una incidencia';
  }

  onQuickAction(action: string): void {
    switch(action) {
      case 'open-messaging': this.router.navigate(['/messages']); break;
      case 'schedule-visit': this.router.navigate(['/appointments']); break;
      case 'view-reports': this.router.navigate(['/reports', this.patientId]); break;
      case 'emergency': this.handleEmergency(); break;
      default: console.warn('Acción no reconocida:', action);
    }
  }

  private handleEmergency(): void {
    if (window.confirm('¿Contactar a servicios de emergencia?')) {
      alert('🚨 Contactando a emergencias...');
    }
  }

  resolveAlert(alert: AlertItem): void {
    if (!this.patientId) return;
    if (!window.confirm(`¿Resolver ${alert.title || alert.type || 'alerta'}?`)) return;
    
    try {
      this.websocket.send('alert_update', {
        id: alert.id,
        patientId: this.patientId,
        status: 'resolved',
        timestamp: new Date().toISOString()
      });
      if (this.dashboard) {
        this.dashboard = {
          ...this.dashboard,
          alerts: this.dashboard.alerts?.map(a => a.id === alert.id ? { ...a, status: 'resolved' } : a)
        };
      }
      console.log('✅ Alerta resuelta:', alert.id);
    } catch (error) {
      console.error('❌ Error:', error);
      this.error = 'No se pudo resolver la alerta';
      setTimeout(() => this.error = null, 3000);
    }
  }

  refresh(): void {
    if (this.patientId) this.loadDashboard(this.patientId);
  }

  logout(): void {
    this.websocket.disconnect();
    this.router.navigate(['/login']).then(() => {
      sessionStorage.clear();
      localStorage.removeItem('auth');
    });
  }

  getPressureClass(systolic?: number, diastolic?: number): string {
    if (!systolic || !diastolic) return '';
    if (systolic >= 180 || diastolic >= 120) return 'critical';
    if (systolic >= 140 || diastolic >= 90) return 'high';
    if (systolic >= 130 || diastolic >= 80) return 'elevated';
    return 'normal';
  }

  scrollToAlerts(): void {
    document.querySelector('.alerts')?.scrollIntoView({ behavior: 'smooth' });
  }
}