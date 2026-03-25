import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Servicios
import { DashboardService, CaregiverDashboardResponse, AlertItem } from '../services/dashboard';
import { WebsocketService, PressureUpdate, AlertUpdate, AdherenceUpdate } from '../services/websocket';
import { AuthService, ActiveSession } from '../services/auth.service';

// Componentes
import { Charts } from '../components/charts/charts.component';
import { AlertsList } from '../components/alerts-list/alerts-list.component';
import { QuickActions } from '../components/quick-actions/quick-actions.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
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

  sessions: ActiveSession[] = [];
  sessionsLoading = false;
  sessionsError: string | null = null;
  showSessions = false;

  private destroy$ = new Subject<void>();
  private patientId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dashboardService: DashboardService,
    private websocket: WebsocketService,
    private auth: AuthService
  ) {}

  // ============= GETTERS =============
  
  get activeAlertsCount(): number {
    return (this.dashboard?.alerts ?? []).filter(a => a?.status === 'active').length;
  }

  get adherenceDisplay(): string {
    const v = this.dashboard?.summary?.adherencePercentage;
    return v !== undefined && v !== null ? `${v}%` : 'Sin datos';
  }

  get lastBloodPressureDisplay(): string {
    const bp = this.dashboard?.vitals?.bloodPressure?.last;
    return bp ? `${bp.systolic}/${bp.diastolic}` : 'Sin datos';
  }

  get lastBloodPressureTime(): string {
    return this.dashboard?.vitals?.bloodPressure?.last?.timestamp 
      ? this.formatDate(this.dashboard.vitals.bloodPressure.last.timestamp)
      : '';
  }

  // ============= LIFECYCLE =============

  ngOnInit(): void {
    // Obtener patientId de la ruta (ej: /dashboard/1)
    this.patientId = this.route.snapshot.paramMap.get('patientId');
    
    if (!this.patientId) {
      this.error = 'Identificador del paciente no encontrado';
      this.loading = false;
      return;
    }

    console.log('📌 Dashboard para paciente:', this.patientId);
    
    // Cargar datos iniciales
    this.loadDashboard(this.patientId);

    // Cargar sesiones activas
    this.loadSessions();

    // Configurar WebSocket
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.websocket.disconnect();
  }

  // ============= CARGA DE DATOS =============

  private loadDashboard(patientId: string): void {
    this.loading = true;
    this.error = null;
    
    this.dashboardService.getDashboard(patientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboard = data;
          this.loading = false;
          console.log('✅ Dashboard cargado:', data);
        },
        error: (err) => {
          this.error = 'No se pudo cargar el estado del paciente';
          this.loading = false;
          console.error('❌ Error loading dashboard:', err);
        }
      });
  }

  refresh(): void {
    if (this.patientId) {
      this.loadDashboard(this.patientId);
    }
  }

  loadSessions(): void {
    this.sessionsLoading = true;
    this.sessionsError = null;
    this.auth.getActiveSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.sessionsLoading = false;
      },
      error: () => {
        this.sessionsLoading = false;
        this.sessionsError = 'No se pudieron cargar las sesiones activas';
      }
    });
  }

  // ============= WEBSOCKET =============

  private setupWebSocket(): void {
    try {
      const ws = this.websocket.connect('ws://localhost/ws/notifications');
      this.websocketConnected = this.websocket.isConnected();

      // Mensajes generales
      ws.messages
        .pipe(takeUntil(this.destroy$))
        .subscribe(msg => {
          console.log('📨 WebSocket message:', msg);
        });

      // Actualizaciones de presión
      ws.pressure
        .pipe(takeUntil(this.destroy$))
        .subscribe((update: PressureUpdate) => {
          this.handlePressureUpdate(update);
        });

      // Actualizaciones de alertas
      ws.alerts
        .pipe(takeUntil(this.destroy$))
        .subscribe((update: AlertUpdate) => {
          this.handleAlertUpdate(update);
        });

      // Actualizaciones de adherencia
      ws.adherence
        .pipe(takeUntil(this.destroy$))
        .subscribe((update: AdherenceUpdate) => {
          this.handleAdherenceUpdate(update);
        });
    } catch (error) {
      console.error('❌ Error conectando WebSocket:', error);
      this.websocketConnected = false;
    }
  }

  private handlePressureUpdate(update: PressureUpdate): void {
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
            {
              systolic: update.systolic,
              diastolic: update.diastolic,
              timestamp: update.timestamp
            }
          ].slice(-30) // Mantener últimas 30 lecturas
        }
      }
    };
  }

  private handleAlertUpdate(update: AlertUpdate): void {
    if (!this.dashboard) return;

    const alerts = this.dashboard.alerts || [];
    
    if (update.status === 'active') {
      // Nueva alerta activa
      const newAlert: AlertItem = {
        id: update.id,
        status: update.status,
        severity: update.severity,
        timestamp: update.timestamp,
        type: 'system',
        title: this.getAlertTitle(update.severity),
        message: this.getAlertMessage(update)
      };
      
      this.dashboard = {
        ...this.dashboard,
        alerts: [newAlert, ...alerts]
      };
    } else {
      // Actualizar estado de alerta existente
      this.dashboard = {
        ...this.dashboard,
        alerts: alerts.map(a => 
          a.id === update.id ? { ...a, status: update.status } : a
        )
      };
    }
  }

  private handleAdherenceUpdate(update: AdherenceUpdate): void {
    if (!this.dashboard || update.patientId !== this.patientId) return;

    this.dashboard = {
      ...this.dashboard,
      summary: {
        ...this.dashboard.summary,
        adherencePercentage: update.adherencePercent
      },
      vitals: {
        ...this.dashboard.vitals,
        adherence: {
          last7DaysPercent: update.adherencePercent
        }
      }
    };
  }

  private getAlertTitle(severity?: string): string {
    const titles = {
      critical: '¡ALERTA CRÍTICA!',
      high: 'Alerta de alta prioridad',
      medium: 'Alerta',
      low: 'Notificación'
    };
    return titles[severity as keyof typeof titles] || 'Alerta del sistema';
  }

  private getAlertMessage(update: AlertUpdate): string {
    if (update.id.includes('pressure')) {
      return 'Presión arterial fuera de rango normal';
    }
    if (update.id.includes('medication')) {
      return 'Medicación no tomada según lo programado';
    }
    return 'Se ha detectado una incidencia';
  }

  // ============= ACCIONES =============

  onQuickAction(action: string): void {
    console.log('🚀 Acción rápida:', action);
    
    switch(action) {
      case 'open-messaging':
        this.router.navigate(['/messages']);
        break;
      case 'schedule-visit':
        this.router.navigate(['/appointments']);
        break;
      case 'view-reports':
        this.router.navigate(['/reports', this.patientId]);
        break;
      case 'emergency':
        this.handleEmergency();
        break;
      default:
        console.warn('Acción no reconocida:', action);
    }
  }

  private handleEmergency(): void {
    if (window.confirm('¿Está seguro de que desea contactar a servicios de emergencia?')) {
      alert('🚨 Contactando a servicios de emergencia...');
      // Aquí iría la lógica real de emergencia
    }
  }

  resolveAlert(alert: AlertItem): void {
    if (!this.patientId) {
      console.warn('No se puede resolver alerta: patientId no disponible');
      return;
    }
    
    const alertDescription = alert.title || alert.type || 'alerta';
    if (!window.confirm(`¿Resolver ${alertDescription}?`)) {
      return;
    }
    
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
          alerts: this.dashboard.alerts?.map(a =>
            a.id === alert.id ? { ...a, status: 'resolved' } : a
          )
        };
      }
      
      console.log('✅ Alerta resuelta:', alert.id);
      
    } catch (error) {
      console.error('❌ Error al resolver alerta:', error);
      this.error = 'No se pudo resolver la alerta';
      
      setTimeout(() => {
        this.error = null;
      }, 3000);
    }
  }

  logout(): void {
    this.websocket.disconnect();
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Si falla logout, igual limpiamos sesión del frontend y redirigimos
        this.router.navigate(['/login']);
      }
    });
  }

  toggleSessions(): void {
    this.showSessions = !this.showSessions;
    if (this.showSessions && this.sessions.length === 0 && !this.sessionsLoading) {
      this.loadSessions();
    }
  }

  closeSession(session: ActiveSession): void {
    this.auth.closeSession(session.id).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(s => s.id !== session.id);
      },
      error: () => {
        this.sessionsError = 'No se pudo cerrar la sesión seleccionada';
      }
    });
  }

  closeAllSessions(): void {
    if (!window.confirm('¿Cerrar todas las sesiones activas?')) {
      return;
    }
    this.auth.closeAllSessions().subscribe({
      next: () => {
        this.sessions = [];
      },
      error: () => {
        this.sessionsError = 'No se pudieron cerrar todas las sesiones';
      }
    });
  }

  // ============= UTILIDADES =============

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  getPressureClass(systolic?: number, diastolic?: number): string {
    if (!systolic || !diastolic) return '';
    if (systolic >= 180 || diastolic >= 120) return 'critical';
    if (systolic >= 140 || diastolic >= 90) return 'high';
    if (systolic >= 130 || diastolic >= 80) return 'elevated';
    return 'normal';
  }

  scrollToAlerts(): void {
    const element = document.querySelector('.alerts');
    element?.scrollIntoView({ behavior: 'smooth' });
  }
}