import { Component, ElementRef, ViewChild, ViewChildren, QueryList, AfterViewInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Headermenu } from "../../template/headermenu/headermenu";
import { Footer } from "../../template/footer/footer";
import { Breadcrumbs } from "../breadcrumbs/breadcrumbs";
import * as THREE from 'three';

@Component({
  selector: 'app-recursos',
  standalone: true,
  imports: [Headermenu, Footer, CommonModule, Breadcrumbs],
  templateUrl: './recursos.html',
  styleUrl: './recursos.css',
})
export class Recursos implements AfterViewInit, OnDestroy {
  // Referencias para Three.js
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  // Referencias para animaciones de Scroll (estilo Nosotros)
  @ViewChildren('animateUp') elementsToAnimate!: QueryList<ElementRef>;
  @ViewChildren('infoCard') infoCards!: QueryList<ElementRef>;

  slides = [
    {
      num: '01',
      title: 'Monitoreo <br>Wearable',
      description: 'Dispositivo biomédico de pulso diseñado para la captura de constantes hemodinámicas. Utiliza sensores PPG de alta resolución para el seguimiento continuo de la presión arterial sistólica y diastólica.'
    },
    {
      num: '02',
      title: 'Ecosistema <br>Móvil',
      description: 'Interfaz de gestión para el paciente que centraliza el registro de presiones. Actúa como el puente de comunicación mediante Bluetooth BLE, procesando datos para alertas preventivas.'
    },
    {
      num: '03',
      title: 'Plataforma <br>Web',
      description: 'Panel web de alta fidelidad diseñado para especialistas en cardiología. Integra herramientas de Big Data para visualizar tendencias históricas y reportes detallados.'
    }
  ];

  currentSlideIndex = 0;
  isBrowser: boolean;

  // Propiedades de Three.js
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private galleryGroup = new THREE.Group();
  private paintingGroups: THREE.Group[] = [];
  private currentScroll = 0;
  private targetScroll = 0;
  private snapTimer: any;
  private mouse = { x: 0, y: 0 };
  private animationId!: number;

  private readonly CONFIG = {
    slideCount: 3,
    spacingX: 45,
    pWidth: 16,
    pHeight: 20,
    camZ: 35,
    wallAngleY: -0.25,
    snapDelay: 200,
    lerpSpeed: 0.06,
    frameColor: 0xE8E8E8
  };

  private totalWidth = 3 * 45;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      // Iniciamos ambos sistemas: Three.js y Observadores de Scroll
      setTimeout(() => {
        this.initThree();
        this.animate();
        this.onResize();
        this.initScrollAnimations(); // <-- Implementación de Nosotros
        this.initCard3DAnimations();   // <-- Implementación de Nosotros
      }, 100);
    }
  }

  /* ==========================================================================
     1. LÓGICA DE ANIMACIONES DE SCROLL (HEREDADA DE NOSOTROS)
     ========================================================================== */

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
        }
      });
    }, { threshold: 0.1 });

    this.infoCards.forEach(card => observer.observe(card.nativeElement));
  }

  /* ==========================================================================
     2. LÓGICA DE THREE.JS (GALLERY)
     ========================================================================== */

  private initThree() {
    if (!this.canvasContainer) return;
    this.scene = new THREE.Scene();

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, this.CONFIG.camZ);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.canvasContainer.nativeElement.innerHTML = '';
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    this.scene.add(this.galleryGroup);

    const textureLoader = new THREE.TextureLoader();
    const planeGeo = new THREE.PlaneGeometry(this.CONFIG.pWidth, this.CONFIG.pHeight);
    const frameGeo = new THREE.BoxGeometry(this.CONFIG.pWidth + 0.8, this.CONFIG.pHeight + 0.8, 0.5);
    const frameMat = new THREE.MeshBasicMaterial({ color: this.CONFIG.frameColor });

    const images = ['assets/pulsera.png', 'assets/pulsera.png', 'assets/pulsera.png'];

    for (let i = 0; i < this.CONFIG.slideCount; i++) {
      const group = new THREE.Group();
      group.position.set(i * this.CONFIG.spacingX, 0, 0);

      const texture = textureLoader.load(images[i]);
      texture.colorSpace = THREE.SRGBColorSpace;

      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.z = 0.31;

      const frame = new THREE.Mesh(frameGeo, frameMat);
      const shadowGeo = new THREE.PlaneGeometry(this.CONFIG.pWidth + 1, this.CONFIG.pHeight + 1);
      const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12 });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.position.set(0.8, -0.8, -0.6);

      group.add(frame, mesh, shadow);
      this.galleryGroup.add(group);
      this.paintingGroups.push(group);
    }

    this.galleryGroup.rotation.y = this.CONFIG.wallAngleY;
    this.galleryGroup.position.x = 8;
  }

  goToSlide(index: number) {
    if (!this.isBrowser) return;
    const diff = index - this.currentSlideIndex;
    this.targetScroll += diff * this.CONFIG.spacingX;
  }

  @HostListener('window:wheel', ['$event'])
  onWheel(e: WheelEvent) {
    if (!this.isBrowser) return;
    // Detenemos el scroll si estamos dentro del área del canvas para controlar la galería
    // Opcional: e.preventDefault();
    this.targetScroll += e.deltaY * 0.1;
    if (this.snapTimer) clearTimeout(this.snapTimer);
    this.snapTimer = setTimeout(() => this.snapToNearest(), this.CONFIG.snapDelay);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (!this.isBrowser) return;
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  private snapToNearest() {
    const index = Math.round(this.targetScroll / this.CONFIG.spacingX);
    this.targetScroll = index * this.CONFIG.spacingX;
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.currentScroll += (this.targetScroll - this.currentScroll) * this.CONFIG.lerpSpeed;

    const xMove = this.currentScroll * Math.cos(this.CONFIG.wallAngleY);
    const zMove = this.currentScroll * Math.sin(this.CONFIG.wallAngleY);

    this.camera.position.x = xMove;
    this.camera.position.z = this.CONFIG.camZ - zMove;

    this.paintingGroups.forEach((group, i) => {
      const originalX = i * this.CONFIG.spacingX;
      const distFromCam = this.currentScroll - originalX;
      const shift = Math.round(distFromCam / this.totalWidth) * this.totalWidth;
      group.position.x = originalX + shift;
    });

    this.camera.rotation.x = this.mouse.y * 0.05;
    this.camera.rotation.y = -this.mouse.x * 0.05;

    const rawIndex = Math.round(this.currentScroll / this.CONFIG.spacingX);
    this.currentSlideIndex = ((rawIndex % this.CONFIG.slideCount) + this.CONFIG.slideCount) % this.CONFIG.slideCount;

    this.renderer.render(this.scene, this.camera);
  }

  @HostListener('window:resize')
  onResize() {
    if (!this.isBrowser || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      if (this.animationId) cancelAnimationFrame(this.animationId);
      if (this.renderer) {
        this.renderer.dispose();
        this.renderer.forceContextLoss();
      }
    }
  }
}