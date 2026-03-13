import { Component, AfterViewInit, ViewChildren, QueryList, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ShaderBackgroundComponent } from '../../components/ui/shader-background/shader-background.component';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, ShaderBackgroundComponent],
  templateUrl: './contacto.html',
  styleUrl: './contacto.css',
})
export class Contacto implements AfterViewInit {
  @ViewChildren('animateUp') elementsToAnimate!: QueryList<ElementRef>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Intentamos múltiples veces asegurar que el DOM esté listo y Angular haya poblado el QueryList

      // 1. Intento casi inmediato
      setTimeout(() => this.triggerAnimations(), 100);

      // 2. Intento al medio segundo
      setTimeout(() => this.triggerAnimations(), 500);

      // 3. Intento al segundo (fallback final)
      setTimeout(() => this.triggerAnimations(), 1000);
    }
  }

  private triggerAnimations() {
    // Usamos el QueryList de Angular
    if (this.elementsToAnimate && this.elementsToAnimate.length > 0) {
      this.runAnimation(this.elementsToAnimate.toArray().map(el => el.nativeElement));
      return;
    }

    // Fallback: Si Angular no pobló el QueryList, buscamos directamente en el DOM
    const items = document.querySelectorAll('.animate-entrance');
    if (items.length > 0) {
      this.runAnimation(Array.from(items));
    }
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
        delay: index * 40,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'both'
      });
    });
  }
}
