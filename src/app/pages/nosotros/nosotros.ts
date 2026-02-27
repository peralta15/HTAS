import { Component, AfterViewInit, ElementRef, QueryList, ViewChildren, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; // Añadido
import { Headermenu } from '../../template/headermenu/headermenu';
import { Footer } from "../../template/footer/footer";

@Component({
  selector: 'app-nosotros',
  standalone: true,
  imports: [CommonModule, Headermenu, Footer],
  templateUrl: './nosotros.html',
  styleUrl: './nosotros.css',
})
export class Nosotros implements AfterViewInit {
  // Referencias para las secciones y las cards
  @ViewChildren('animateUp') elementsToAnimate!: QueryList<ElementRef>;
  @ViewChildren('infoCard') infoCards!: QueryList<ElementRef>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Pequeño delay para asegurar que el DOM cargó tras el refresco
      setTimeout(() => {
        this.initScrollAnimations();
        this.initCard3DAnimations();
      }, 100);
    }
  }

  private initScrollAnimations() {
    if (!this.elementsToAnimate) return;
    this.elementsToAnimate.forEach((el, index) => {
      el.nativeElement.animate([
        { opacity: 0, transform: 'translateY(60px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: 800,
        delay: index * 40,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'both'
      });
    });
  }

  private initCard3DAnimations() {
    if (!this.infoCards) return;
    this.infoCards.forEach((card, index) => {
      card.nativeElement.animate([
        { transform: 'perspective(1000px) rotateX(25deg) scale(0.9)', opacity: 0 },
        { transform: 'perspective(1000px) rotateX(0deg) scale(1)', opacity: 1 }
      ], {
        duration: 900,
        delay: (this.elementsToAnimate?.length || 0) * 40 + (index * 80),
        easing: 'ease-out',
        fill: 'both'
      });
    });
  }
}