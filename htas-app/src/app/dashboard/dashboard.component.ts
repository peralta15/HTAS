import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService, CaregiverDashboardResponse } from '../services/dashboard';
import { WebsocketService, NotificationMessage } from '../services/websocket';
import { Charts } from '../components/charts/charts';
import { AlertsList } from '../components/alerts-list/alerts-list';
import { QuickActions } from '../components/quick-actions/quick-actions';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Charts, AlertsList, QuickActions],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  dashboard: CaregiverDashboardResponse | null = null;

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
    // Prefer route param `patientId`; component can be reused in routes that provide it
    this.patientId = this.route.snapshot.paramMap.get('patientId');
    if (!this.patientId) {
      this.error = 'Patient identifier is missing.';
      this.loading = false;
      return;
    }

    this.loadDashboard(this.patientId);
    const ws = this.websocket.connect('/ws/notifications');
    ws.messages
      .pipe(takeUntil(this.destroy$))
      .subscribe((msg: NotificationMessage) => this.handleRealtime(msg));
  }

  private loadDashboard(patientId: string) {
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
          this.error = 'No se pudo cargar el estado del paciente.';
          this.loading = false;
        }
      });
  }

  private handleRealtime(msg: NotificationMessage) {
    if (!msg || !msg.type) return;

    // Handle only a few well-known messages and delegate rendering to child components.
    if (msg.type === 'dashboard.update' && msg.payload?.patientId === this.patientId) {
      // Merge minimal fields from payload into current state.
      if (this.dashboard) {
        this.dashboard = { ...this.dashboard, ...msg.payload } as CaregiverDashboardResponse;
      } else {
        this.dashboard = msg.payload as CaregiverDashboardResponse;
      }
    }

    if (msg.type === 'alert.created' && msg.payload) {
      if (this.dashboard) {
        const existing = this.dashboard.alerts ?? [];
        this.dashboard = { ...this.dashboard, alerts: [msg.payload, ...existing] } as CaregiverDashboardResponse;
      }
    }
  }

  onQuickAction(name: string) {
    // Minimal, safe handling of quick actions. Navigation or API calls should be implemented by parent services.
    if (name === 'open-messaging') {
      this.router.navigate(['/messages']);
    }
  }

  logout(): void {
    // Navigate to login page and clear client session state.
    this.router.navigate(['/login']).then(() => {
      try {
        // best-effort: clear client-side storage
        sessionStorage.clear();
        localStorage.removeItem('auth');
      } finally {
        // avoid logging sensitive details
        window.location.reload();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.websocket.disconnect();
  }
}
