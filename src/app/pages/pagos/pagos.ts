import { Component, AfterViewInit, ViewChildren, QueryList, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagos.html',
  styleUrl: './pagos.css',
})
export class Pagos implements AfterViewInit {
  @ViewChildren('animateUp') elementsToAnimate!: QueryList<ElementRef>;

  private observer?: IntersectionObserver;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initIntersectionObserver();
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private initIntersectionObserver() {
    if (!this.elementsToAnimate) return;

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          this.runSingleAnimation(target);
          this.observer?.unobserve(target);
        }
      });
    }, options);

    this.elementsToAnimate.forEach(el => {
      this.observer?.observe(el.nativeElement);
    });
  }

  private runSingleAnimation(el: HTMLElement) {
    if (el.dataset['animated'] === 'true') return;
    el.dataset['animated'] = 'true';

    const anim = el.animate([
      { opacity: 0, transform: 'translateY(40px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: 500,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    });

    anim.onfinish = () => {
      el.style.opacity = '1';
      if (el.classList.contains('feature-label-box')) {
        el.style.transform = '';
      }
    };
  }
}
