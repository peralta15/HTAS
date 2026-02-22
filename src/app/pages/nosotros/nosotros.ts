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
    }, { threshold: 0.1 });

    this.elementsToAnimate.forEach(el => observer.observe(el.nativeElement));
  }

  private initCard3DAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.animate([
            { transform: 'perspective(1000px) rotateX(25deg) scale(0.9)', opacity: 0 },
            { transform: 'perspective(1000px) rotateX(0deg) scale(1)', opacity: 1 }
          ], {
            duration: 900,
            easing: 'ease-out',
            fill: 'forwards'
          });
        } else {
          entry.target.animate([
            { transform: 'perspective(1000px) rotateX(0deg) scale(1)', opacity: 1 },
            { transform: 'perspective(1000px) rotateX(25deg) scale(0.9)', opacity: 0 }
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
}