import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  // Propiedades con valores por defecto
  userName: string = 'Usuario';
  userInitials: string = 'US';
  notifications: number = 0;
  loading: boolean = true;

  @Output() menuClick = new EventEmitter<void>();

  ngOnInit(): void {
    // Simular carga de datos desde API
    setTimeout(() => {
      this.userName = 'John';
      this.userInitials = 'JO';
      this.notifications = 3;
      this.loading = false;
    }, 1000);
  }

  toggleSidebar(): void {
    this.menuClick.emit();
  }
}