import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../models/user.model';  // ← IMPORTAR DEL MODELO

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-modal.component.html',
  styleUrls: ['./user-modal.component.css']
})
export class UserModalComponent {
  @Input() user: User | null = null;
  @Input() mode: 'view' | 'edit' = 'view';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() userChange = new EventEmitter<User>();

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.close.emit();
  }

  @HostListener('click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  isPaciente(): boolean {
    return this.user?.role === 'PACIENTE';
  }

  onFieldChange(): void {
    if (this.user) {
      this.userChange.emit(this.user);
    }
  }

  onChronicConditionsChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    if (this.user?.medicalProfile) {
      this.user.medicalProfile.chronicConditions = value.split(',').map(s => s.trim());
      this.onFieldChange();
    }
  }

  onAllergiesChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    if (this.user?.medicalProfile) {
      this.user.medicalProfile.allergies = value.split(',').map(s => s.trim());
      this.onFieldChange();
    }
  }

  onMedicationsChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    if (this.user?.medicalProfile) {
      this.user.medicalProfile.medications = value.split(',').map(s => s.trim());
      this.onFieldChange();
    }
  }

  getChronicConditionsString(): string {
    return this.user?.medicalProfile?.chronicConditions?.join(', ') || '';
  }

  getAllergiesString(): string {
    return this.user?.medicalProfile?.allergies?.join(', ') || '';
  }

  getMedicationsString(): string {
    return this.user?.medicalProfile?.medications?.join(', ') || '';
  }

  getRoleOptions(): string[] {
    return ['PACIENTE', 'CUIDADOR', 'ADMIN'];
  }

  getRoleText(role: string): string {
    const texts: Record<string, string> = {
      'PACIENTE': 'Paciente',
      'CUIDADOR': 'Cuidador',
      'ADMIN': 'Administrador'
    };
    return texts[role] || role;
  }
}