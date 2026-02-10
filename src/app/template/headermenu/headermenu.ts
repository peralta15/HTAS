import { Component, HostListener, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-headermenu',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './headermenu.html',
  styleUrl: './headermenu.css',
})
export class Headermenu implements OnInit {
  isMenuOpen = false;
  scrollPercentage = 0;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.onWindowScroll();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.isBrowser) {
      const scrollOffset = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      this.scrollPercentage = windowHeight > 0 ? (scrollOffset / windowHeight) * 100 : 0;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.isBrowser) {
      if (window.innerWidth > 768) {
        this.isMenuOpen = false;
      }
    }
  }
}