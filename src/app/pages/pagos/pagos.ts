import { Component, AfterViewInit, ViewChildren, QueryList, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Headermenu } from "../../template/headermenu/headermenu";
import { Footer } from "../../template/footer/footer";

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, Headermenu, Footer],
  templateUrl: './pagos.html',
  styleUrl: './pagos.css',
})
export class Pagos implements AfterViewInit {
  @ViewChildren('animateUp') elementsToAnimate!: QueryList<ElementRef>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Pequeño timeout para asegurar que el DOM esté listo
      setTimeout(() => {
        this.initScrollAnimations();
      }, 200);
    }
  }

  private initScrollAnimations() {
    if (!this.elementsToAnimate || this.elementsToAnimate.length === 0) {
      // Fallback rápido si ViewChildren no ha poblado el QueryList
      const items = document.querySelectorAll('.animate-entrance');
      if (items.length > 0) {
        this.runAnimation(Array.from(items));
      }
      return;
    }

    this.runAnimation(this.elementsToAnimate.toArray().map(el => el.nativeElement));
  }

  private runAnimation(elements: any[]) {
    elements.forEach((el, index) => {
      // Evitar re-animar si ya se disparó
      if (el.dataset['animated'] === 'true') return;
      el.dataset['animated'] = 'true';

      el.animate([
        { opacity: 0, transform: 'translateY(60px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: 800,
        delay: index * 60,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'both'
      });
    });
  }
}
