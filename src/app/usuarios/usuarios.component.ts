import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserModalComponent } from './user-modal.component';
import { User } from '../models/user.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UserModalComponent
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: User[] = [];
  filteredUsuarios: User[] = [];
  searchTerm: string = '';
  showModal: boolean = false;
  selectedUser: User | null = null;
  modalMode: 'view' | 'edit' = 'view';

  private mockUsers: User[] = [
    {
      id: '1',
      fullName: 'Antonio García',
      email: 'antonio.garcia@email.com',
      role: 'PACIENTE',
      isActive: true,
      hasCaregiver: true,
      device: 'HTAS-001',
      medicalProfile: {
        bloodType: 'O+',
        chronicConditions: ['Hipertensión', 'Diabetes tipo 2'],
        allergies: ['Penicilina', 'Sulfamidas'],
        medications: ['Enalapril 10mg', 'Metformina 850mg'],
        lastBloodPressure: '128/82',
        emergencyContact: 'María García - 600123456'
      }
    },
    {
      id: '2',
      fullName: 'María González',
      email: 'maria.gonzalez@email.com',
      role: 'CUIDADOR',
      isActive: true,
      hasCaregiver: false,
      device: 'HTAS-002'
    },
    {
      id: '3',
      fullName: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@email.com',
      role: 'PACIENTE',
      isActive: false,
      hasCaregiver: true,
      device: 'HTAS-003',
      medicalProfile: {
        bloodType: 'A-',
        chronicConditions: ['Hipertensión'],
        allergies: ['Aspirina'],
        medications: ['Losartán 50mg'],
        lastBloodPressure: '135/88',
        emergencyContact: 'Laura Rodríguez - 600789012'
      }
    },
    {
      id: '4',
      fullName: 'Ana Martínez',
      email: 'ana.martinez@email.com',
      role: 'ADMIN',
      isActive: true,
      hasCaregiver: false,
      device: 'HTAS-004'
    }
  ];

  ngOnInit(): void {
    this.usuarios = this.mockUsers;
    this.filteredUsuarios = this.usuarios;
  }

  trackById(index: number, user: User): string {
    return user.id;
  }

  filterUsers(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsuarios = this.usuarios.filter(user =>
      user.fullName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    );
  }

  openModal(user: User, mode: 'view' | 'edit'): void {
    this.selectedUser = { ...user };
    this.modalMode = mode;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedUser = null;
    document.body.style.overflow = 'auto';
  }

  saveUser(): void {
    if (this.selectedUser) {
      const index = this.usuarios.findIndex(u => u.id === this.selectedUser!.id);
      if (index !== -1) {
        this.usuarios[index] = { ...this.selectedUser };
        this.filterUsers();
      }
      this.closeModal();
    }
  }

  getRoleClass(role: string): string {
    const classes: Record<string, string> = {
      'PACIENTE': 'role-patient',
      'CUIDADOR': 'role-caregiver',
      'ADMIN': 'role-admin'
    };
    return classes[role] || '';
  }

  getRoleText(role: string): string {
    const texts: Record<string, string> = {
      'PACIENTE': 'Paciente',
      'CUIDADOR': 'Cuidador',
      'ADMIN': 'Admin'
    };
    return texts[role] || role;
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  getCaregiverClass(hasCaregiver: boolean | undefined): string {
    return hasCaregiver ? 'caregiver-yes' : 'caregiver-no';
  }

  getCaregiverText(hasCaregiver: boolean | undefined): string {
    return hasCaregiver ? 'Sí' : 'No';
  }
}