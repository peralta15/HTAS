import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserModalComponent } from './user-modal.component';
import { NuevoUsuarioModalComponent } from './nuevo-usuario-modal.component';
import { UserService, ApiUser, UpdateUserRequest } from '../services/users.service';
import { User } from '../models/user.model';

@Component({
    selector: 'app-usuarios',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        UserModalComponent,
        NuevoUsuarioModalComponent
    ],
    templateUrl: './usuarios.component.html',
    styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {
    // Usar la interfaz User del modelo directamente
    usuarios: User[] = [];
    filteredUsuarios: User[] = [];
    
    // UI States
    searchTerm: string = '';
    showModal: boolean = false;
    showNuevoModal: boolean = false;
    selectedUser: User | null = null;
    modalMode: 'view' | 'edit' = 'view';
    
    // Loading y error
    loading: boolean = false;
    error: string | null = null;
    deletingIds = new Set<string>();

    constructor(private userService: UserService) {
        console.log('📌 UsuariosComponent constructor');
    }

    ngOnInit(): void {
        console.log('📌 UsuariosComponent ngOnInit');
        this.loadUsers();
    }

    /**
     * Carga la lista de usuarios desde la API
     */
    loadUsers(): void {
        console.log('📌 Cargando usuarios...');
        this.loading = true;
        this.error = null;
        
        this.userService.getUsers().subscribe({
            next: (apiUsers: ApiUser[]) => {
                console.log('✅ API Response:', apiUsers);
                
                if (!apiUsers || apiUsers.length === 0) {
                    console.warn('⚠️ No hay usuarios en la respuesta');
                    this.usuarios = [];
                } else {
                    this.usuarios = apiUsers.map(u => {
                        const roleText = this.getRoleText(u.rol);
                        return {
                            id: u.id.toString(),
                            fullName: u.nombre_completo,
                            email: u.email,
                            role: u.rol,
                            roleText: roleText, // Asignar valor por defecto
                            isActive: u.activo,
                            hasCaregiver: u.tiene_cuidador,
                            device: u.tiene_dispositivo ? 'HTAS-' + u.id : undefined,
                            medicalProfile: undefined // Opcional
                        };
                    });
                }
                
                console.log('✅ Usuarios transformados:', this.usuarios);
                this.filteredUsuarios = [...this.usuarios];
                this.loading = false;
            },
            error: (error: any) => {
                console.error('❌ Error cargando usuarios:', error);
                this.error = 'Error al cargar usuarios. Verifica que el backend esté corriendo.';
                this.loading = false;
            }
        });
    }

    /**
     * TrackBy para optimizar el renderizado de la tabla
     */
    trackById(index: number, user: User): string {
        return user.id;
    }

    /**
     * Filtra usuarios según el término de búsqueda
     */
    filterUsers(): void {
        console.log('Filtrando por:', this.searchTerm);
        const term = this.searchTerm.toLowerCase();
        
        if (!term.trim()) {
            this.filteredUsuarios = [...this.usuarios];
            return;
        }
        
        this.filteredUsuarios = this.usuarios.filter(user =>
            user.fullName.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.role.toLowerCase().includes(term)
        );
        console.log('Usuarios filtrados:', this.filteredUsuarios.length);
    }

    /**
     * Abre el modal para ver o editar un usuario
     */
    openModal(user: User, mode: 'view' | 'edit'): void {
        console.log('Abriendo modal:', mode, user);
        this.selectedUser = { ...user };
        this.modalMode = mode;
        this.showModal = true;
        document.body.style.overflow = 'hidden';
    }

    /**
     * Abre el modal para crear un nuevo usuario
     */
    abrirNuevoUsuario(): void {
        console.log('➕ Abriendo modal de nuevo usuario');
        this.showNuevoModal = true;
        document.body.style.overflow = 'hidden';
    }

    /**
     * Cierra cualquier modal abierto
     */
    closeModal(): void {
        console.log('Cerrando modal');
        this.showModal = false;
        this.showNuevoModal = false;
        this.selectedUser = null;
        document.body.style.overflow = 'auto';
    }

    /**
     * Callback para cuando se cierra un modal (desde el template)
     */
    onModalClose(): void {
        this.closeModal();
    }

    /**
     * Callback para cuando se crea un usuario exitosamente
     */
    onUserCreated(): void {
        console.log('✅ Usuario creado, recargando lista...');
        this.loadUsers();
        this.closeModal();
    }

    /**
     * Guarda cambios de un usuario editado
     */
    saveUser(): void {
        if (!this.selectedUser) {
            return;
        }

        const idNumber = Number(this.selectedUser.id);
        if (Number.isNaN(idNumber)) {
            console.error('ID de usuario inválido:', this.selectedUser.id);
            return;
        }

        const payload: UpdateUserRequest = {
            nombre_completo: this.selectedUser.fullName,
            email: this.selectedUser.email,
            rol: this.selectedUser.role as any,
            activo: this.selectedUser.isActive
        };

        this.loading = true;
        this.userService.updateUser(idNumber, payload).subscribe({
            next: () => {
                this.loading = false;
                this.loadUsers();
                this.closeModal();
            },
            error: (err) => {
                this.loading = false;
                console.error('❌ Error actualizando usuario:', err);
                this.error = err?.error?.error || 'No se pudo actualizar el usuario';
            }
        });
    }

    /**
     * Elimina un usuario con confirmación
     */
    deleteUser(user: User): void {
        const idNumber = Number(user.id);
        if (Number.isNaN(idNumber)) {
            console.error('ID de usuario inválido:', user.id);
            return;
        }

        const confirmDelete = window.confirm(`¿Eliminar al usuario "${user.fullName}"?`);
        if (!confirmDelete) {
            return;
        }

        this.deletingIds.add(user.id);
        this.userService.deleteUser(idNumber).subscribe({
            next: () => {
                this.deletingIds.delete(user.id);
                this.usuarios = this.usuarios.filter(u => u.id !== user.id);
                this.filteredUsuarios = this.filteredUsuarios.filter(u => u.id !== user.id);
            },
            error: (err) => {
                this.deletingIds.delete(user.id);
                console.error('❌ Error eliminando usuario:', err);
                this.error = err?.error?.error || 'No se pudo eliminar el usuario';
            }
        });
    }

    /**
     * Obtiene la clase CSS para el badge del rol
     */
    getRoleClass(role: string): string {
        const classes: Record<string, string> = {
            'PACIENTE': 'role-patient',
            'CUIDADOR': 'role-caregiver',
            'ADMIN': 'role-admin'
        };
        return classes[role] || '';
    }

    /**
     * Obtiene el texto legible para el rol
     */
    getRoleText(role: string): string {
        const texts: Record<string, string> = {
            'PACIENTE': 'Paciente',
            'CUIDADOR': 'Cuidador',
            'ADMIN': 'Administrador'
        };
        return texts[role] || role;
    }

    /**
     * Obtiene la clase CSS para el badge del estado
     */
    getStatusClass(isActive: boolean): string {
        return isActive ? 'status-active' : 'status-inactive';
    }

    /**
     * Obtiene el texto legible para el estado
     */
    getStatusText(isActive: boolean): string {
        return isActive ? 'Activo' : 'Inactivo';
    }

    /**
     * Obtiene la clase CSS para el badge de acompañante
     */
    getCaregiverClass(hasCaregiver: boolean | undefined): string {
        return hasCaregiver ? 'caregiver-yes' : 'caregiver-no';
    }

    /**
     * Obtiene el texto legible para acompañante
     */
    getCaregiverText(hasCaregiver: boolean | undefined): string {
        return hasCaregiver ? 'Sí' : 'No';
    }
}