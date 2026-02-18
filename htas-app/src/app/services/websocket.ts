import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';

/** Allowed event types and payload shapes */
export interface PressureUpdate {
  patientId: string;
  systolic: number;
  diastolic: number;
  timestamp: string;
}

export interface AlertUpdate {
  id: string;
  patientId?: string;
  status: 'active' | 'resolved' | 'ignored';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface AdherenceUpdate {
  patientId: string;
  adherencePercent: number;
  windowDays: number;
  timestamp: string;
}

export type NotificationMessage =
  | { type: 'pressure_update'; payload: PressureUpdate }
  | { type: 'alert_update'; payload: AlertUpdate }
  | { type: 'adherence_update'; payload: AdherenceUpdate }
  | { type: string; payload: any };

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
  private socket?: WebSocket;
  private url?: string;

  private reconnectAttempts = 0;
  private reconnectTimerId: any = null;
  private shouldReconnect = true;

  // Subjects for consumers to subscribe to specific event streams
  private messages$ = new Subject<NotificationMessage>();
  private pressure$ = new Subject<PressureUpdate>();
  private alerts$ = new Subject<AlertUpdate>();
  private adherence$ = new Subject<AdherenceUpdate>();

  // Backoff settings
  private readonly initialDelay = 1000; // ms
  private readonly maxDelay = 30000; // ms
  private readonly factor = 1.5;

  constructor(private ngZone: NgZone) {}

  /** Connect to a WebSocket URL. If already connected to same URL, returns existing streams. */
  connect(url = 'ws://localhost/ws/notifications'): { messages: Observable<NotificationMessage>; pressure: Observable<PressureUpdate>; alerts: Observable<AlertUpdate>; adherence: Observable<AdherenceUpdate> } {
    this.url = url;
    this.shouldReconnect = true;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return this.exposeObservables();
    }

    this.openSocket();
    return this.exposeObservables();
  }

  /** Expose read-only observables to callers */
  private exposeObservables() {
    return {
      messages: this.messages$.asObservable(),
      pressure: this.pressure$.asObservable(),
      alerts: this.alerts$.asObservable(),
      adherence: this.adherence$.asObservable(),
    };
  }

  private openSocket() {
    if (!this.url) return;

    try {
      this.socket = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.ngZone.run(() => {
        this.reconnectAttempts = 0;
      });
    };

    this.socket.onmessage = (ev) => {
      this.ngZone.run(() => this.handleMessage(ev.data));
    };

    this.socket.onclose = (ev) => {
      this.ngZone.run(() => {
        // clear socket reference, notify completion and attempt reconnect if allowed
        this.socket = undefined;
        if (this.shouldReconnect) this.scheduleReconnect();
      });
    };

    this.socket.onerror = () => {
      // errors handled by onclose/reconnect; avoid exposing internal error payloads
    };
  }

  private handleMessage(raw: any) {
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // basic validation
      if (!data || typeof data.type !== 'string') return;

      const msg = data as NotificationMessage;
      this.messages$.next(msg);

      // route to typed subjects
      if (msg.type === 'pressure_update') {
        this.pressure$.next(msg.payload as PressureUpdate);
      } else if (msg.type === 'alert_update') {
        this.alerts$.next(msg.payload as AlertUpdate);
      } else if (msg.type === 'adherence_update') {
        this.adherence$.next(msg.payload as AdherenceUpdate);
      }
    } catch {
      // ignore non-JSON or unexpected payloads
    }
  }

  /** Send a typed update to the server. Throws if socket is not open. */
  send(type: 'pressure_update' | 'alert_update' | 'adherence_update', payload: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    const out = JSON.stringify({ type, payload });
    this.socket.send(out);
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || !this.url) return;
    this.reconnectAttempts += 1;
    const delay = Math.min(this.initialDelay * Math.pow(this.factor, this.reconnectAttempts - 1), this.maxDelay);
    // clear any existing timer
    if (this.reconnectTimerId) {
      clearTimeout(this.reconnectTimerId);
    }
    this.reconnectTimerId = setTimeout(() => {
      this.openSocket();
    }, Math.round(delay));
  }

  /** Gracefully stop reconnect attempts and close socket */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimerId) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
    // complete subjects to allow subscribers to clean up
    this.messages$.complete();
    this.pressure$.complete();
    this.alerts$.complete();
    this.adherence$.complete();
  }

  isConnected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
