import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService, CreateUserRequest } from '../services/users.service';  // ← Cambiado a UserService

@Component({
    selector: 'app-nuevo-usuario-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './nuevo-usuario-modal.component.html',
    styleUrls: ['./nuevo-usuario-modal.component.css']
})
export class NuevoUsuarioModalComponent implements OnInit {
    @Output() close = new EventEmitter<void>();
    @Output() userCreated = new EventEmitter<void>();

    userForm: FormGroup;
    roles: string[] = [];
    loading = false;
    submitted = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private userService: UserService  // ← Cambiado a userService
    ) {
        this.userForm = this.fb.group({
            nombre_completo: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            telefono: [''],
            rol: ['', Validators.required],
            activo: [true],
            fecha_nacimiento: [''],
            genero: [''],
            altura_cm: [''],
            peso_kg: [''],
            tipo_sangre: [''],
            antecedentes_familiares: [''],
            fecha_diagnostico: [''],
            tiene_cuidador: [false],
            cuidador_nombre: [''],
            cuidador_telefono: ['']
        });
    }

    get f() { return this.userForm.controls; }

    ngOnInit(): void {
        this.loadRoles();
    }

    loadRoles(): void {
        this.userService.getRoles().subscribe({
            next: (roles: string[]) => {
                this.roles = roles;
            },
            error: (error: any) => {
                console.error('Error cargando roles:', error);
            }
        });
    }

    onSubmit(): void {
        this.submitted = true;
        this.errorMessage = '';

        if (this.userForm.invalid) {
            return;
        }

        this.loading = true;

        const formValue = this.userForm.value;
        
        const userData: CreateUserRequest = {
            nombre_completo: formValue.nombre_completo,
            email: formValue.email,
            password: formValue.password,
            telefono: formValue.telefono || undefined,
            rol: formValue.rol,
            activo: formValue.activo
        };

        if (formValue.rol === 'PACIENTE') {
            userData.perfil_medico = {
                fecha_nacimiento: formValue.fecha_nacimiento || undefined,
                genero: formValue.genero || undefined,
                altura_cm: formValue.altura_cm ? parseFloat(formValue.altura_cm) : undefined,
                peso_kg: formValue.peso_kg ? parseFloat(formValue.peso_kg) : undefined,
                tipo_sangre: formValue.tipo_sangre || undefined,
                antecedentes_familiares: formValue.antecedentes_familiares || undefined,
                fecha_diagnostico: formValue.fecha_diagnostico || undefined,
                tiene_cuidador: formValue.tiene_cuidador,
                cuidador_nombre: formValue.cuidador_nombre || undefined,
                cuidador_telefono: formValue.cuidador_telefono || undefined
            };
        }

        this.userService.createUser(userData).subscribe({
            next: (response: any) => {
                this.loading = false;
                if (response.success) {
                    this.userCreated.emit();
                    this.close.emit();
                } else {
                    this.errorMessage = response.message || 'Error al crear usuario';
                }
            },
            error: (error: any) => {
                this.loading = false;
                this.errorMessage = error.error?.error || 'Error al conectar con el servidor';
                console.error('Error:', error);
            }
        });
    }
}