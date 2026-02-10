import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Headermenu } from "../template/headermenu/headermenu";
import { Footer } from "../template/footer/footer";
import { Breadcrumbs } from "../pages/breadcrumbs/breadcrumbs";
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, Headermenu, Footer, Breadcrumbs, ScrollRevealDirective],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  isModalOpen = false;
  modalTitle = '';
  modalDescription = '';
  activeGalleryTab = 1;

  setActiveGalleryTab(tab: number) {
    this.activeGalleryTab = tab;
  }

  get sliderTransform() {
    // Each slide is 80% width. We want the active slide centered.
    // Center position means 10% margin on left.
    // Shift = 10% - (currentIndex * 80%)
    return `translateX(calc(10% - ${(this.activeGalleryTab - 1) * 80}%))`;
  }


  // Datos para los modales
  modalData = [
    {
      title: 'Texto 1',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      title: 'Texto 2',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      title: 'Texto 3',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      title: 'Texto 4',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    }
  ];

  openModal(index: number) {
    // Ajustar índice (comienza en 0)
    const dataIndex = index - 1;

    if (this.modalData[dataIndex]) {
      this.modalTitle = this.modalData[dataIndex].title;
      this.modalDescription = this.modalData[dataIndex].description;
      this.isModalOpen = true;

      // Deshabilitar scroll del body
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    this.isModalOpen = false;

    // Habilitar scroll del body
    document.body.style.overflow = 'auto';
  }

  // SOLUCIÓN: Usar una sintaxis diferente para capturar el evento ESC
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isModalOpen) {
      this.closeModal();
    }
  }
}