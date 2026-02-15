import { Component, HostListener, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Headermenu } from "../template/headermenu/headermenu";
import { Footer } from "../template/footer/footer";
import { Breadcrumbs } from "../pages/breadcrumbs/breadcrumbs";

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, Headermenu, Footer, Breadcrumbs],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements AfterViewInit {
  @ViewChildren('animateUp') elementsToAnimate!: QueryList<ElementRef>;
  @ViewChildren('infoCard') infoCards!: QueryList<ElementRef>;

  isModalOpen = false;
  modalTitle = '';
  modalDescription = '';
  activeGalleryTab = 1;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Usamos un pequeño delay para asegurar que el DOM esté listo tras la recarga
      setTimeout(() => {
        this.initScrollAnimations();
        this.initCard3DAnimations();
      }, 100);
    }
  }

  /**
   * Animación Reversible (Subir/Bajar)
   * Al recargar, los elementos visibles se disparan automáticamente.
   */
  private initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.animate([
            { opacity: 0, transform: 'translateY(60px)' },
            { opacity: 1, transform: 'translateY(0)' }
          ], {
            duration: 800,
            easing: 'ease-out',
            fill: 'forwards'
          });
        } else {
          // Detecta si el elemento salió por arriba o abajo
          entry.target.animate([
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(60px)' }
          ], {
            duration: 600,
            easing: 'ease-in',
            fill: 'forwards'
          });
        }
      });
    }, {
      threshold: 0.05, // Umbral bajo para que se active apenas asome un pixel
      rootMargin: '0px 0px -50px 0px' // Ajuste para disparar la animación un poco antes
    });

    this.elementsToAnimate.forEach(el => observer.observe(el.nativeElement));
  }

  /**
   * Animación 3D Reversible para Cards
   */
  private initCard3DAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.animate([
            { transform: 'perspective(1000px) rotateX(30deg) scale(0.9)', opacity: 0 },
            { transform: 'perspective(1000px) rotateX(0deg) scale(1)', opacity: 1 }
          ], {
            duration: 900,
            easing: 'ease-out',
            fill: 'forwards'
          });
        } else {
          entry.target.animate([
            { transform: 'perspective(1000px) rotateX(0deg) scale(1)', opacity: 1 },
            { transform: 'perspective(1000px) rotateX(30deg) scale(0.9)', opacity: 0 }
          ], {
            duration: 700,
            easing: 'ease-in',
            fill: 'forwards'
          });
        }
      });
    }, { threshold: 0.1 });

    this.infoCards.forEach(card => observer.observe(card.nativeElement));
  }

  // --- Lógica de Galería ---
  setActiveGalleryTab(tab: number) {
    this.activeGalleryTab = tab;
  }

  get sliderTransform() {
    const desplazamiento = (this.activeGalleryTab - 1) * 33.333;
    return `translateX(-${desplazamiento}%)`;
  }

  // En tu clase Landing
  modalData = [
    {
      title: 'Tu Salud en tus Manos',
      description: 'Nuestra app permite un seguimiento exhaustivo de tus signos vitales sin complicaciones.',
      additionalTitle: 'Beneficios de Autocontrol',
      additionalText: 'El monitoreo constante reduce el riesgo de crisis hipertensivas en un 40%.',
      features: ['Gráficas de tendencia semanal', 'Alertas de valores críticos', 'Exportación de datos a Excel']
    },
    {
      title: 'Gestión Inteligente',
      description: 'Utilizamos algoritmos para analizar la relación entre tu actividad física y tu presión.',
      additionalTitle: 'Ecosistema Conectado',
      additionalText: 'Sincronización automática entre tu pulsera y la plataforma en la nube.',
      features: ['Sincronización vía Bluetooth BLE', 'Bajo consumo de batería', 'Respaldo automático en la nube']
    },
    {
      title: 'Control Tensional',
      description: 'Mantenemos un registro histórico de todas tus mediciones sistólicas y diastólicas.',
      additionalTitle: 'Precisión Médica',
      additionalText: 'Validado bajo estándares internacionales de salud cardiovascular.',
      features: ['Registro de frecuencia cardíaca', 'Detección de arritmias básicas', 'Historial clínico digitalizado']
    },
    {
      title: 'Vivir con Tranquilidad',
      description: 'Siéntete seguro sabiendo que tu familia puede recibir alertas en caso de emergencia.',
      additionalTitle: 'Seguridad y Familia',
      additionalText: 'Un sistema de notificaciones diseñado para actuar rápido cuando más se necesita.',
      features: ['Notificaciones a contactos de emergencia', 'Botón de pánico integrado', 'Localización GPS en emergencias']
    }
  ];

  // Variable para manejar el modal actual de forma completa
  selectedModal: any = null;

  openModal(index: number) {
    const dataIndex = index - 1;
    if (this.modalData[dataIndex]) {
      this.selectedModal = this.modalData[dataIndex]; // Guardamos todo el objeto
      this.isModalOpen = true;
      if (isPlatformBrowser(this.platformId)) {
        document.body.style.overflow = 'hidden';
      }
    }
  }

  closeModal() {
    this.isModalOpen = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isModalOpen) {
      this.closeModal();
    }
  }
}