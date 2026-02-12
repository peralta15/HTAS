import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Headermenu } from "../../template/headermenu/headermenu";
import { Footer } from "../../template/footer/footer";
import * as THREE from 'three';
import { Breadcrumbs } from "../breadcrumbs/breadcrumbs";

@Component({
  selector: 'app-recursos',
  standalone: true,
  imports: [Headermenu, Footer, CommonModule, Breadcrumbs],
  templateUrl: './recursos.html',
  styleUrl: './recursos.css',
})
export class Recursos implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef;

  slides = [
    { num: '01', title: 'Pulsera <br>Inteligente', description: 'Un dispositivo wearable diseñado para el monitoreo hemodinámico constante. Esta pieza integra sensores de alta precisión que traducen los signos vitales en datos accionables, permitiendo una supervisión silenciosa pero rigurosa de la presión arterial en tiempo real.' },
    { num: '02', title: 'Aplicación <br>Móvil', description: 'El núcleo del ecosistema digital. Esta interfaz transforma la complejidad de los datos médicos en una experiencia de usuario intuitiva, facilitando el seguimiento histórico y la generación de alertas preventivas mediante algoritmos de análisis predictivo.' },
    { num: '03', title: 'Pagina <br>Web', description: 'Un centro de control integral orientado al análisis clínico profundo. Diseñada para la visualización de grandes volúmenes de datos, esta solución web permite a los profesionales de la salud gestionar diagnósticos con una claridad estructural sin precedentes.' }
  ];

  currentSlideIndex = 0;
  isBrowser: boolean;

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
      // El pequeño delay asegura que Angular haya terminado de renderizar el layout
      setTimeout(() => {
        this.initThree();
        this.animate();
        this.onResize(); // Forzar ajuste inicial
      }, 50);
    }
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

  private initThree() {
    if (!this.canvasContainer) return;

    // 1. Escena y Niebla
    this.scene = new THREE.Scene();

    // 2. Cámara
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, this.CONFIG.camZ);

    // 3. Renderer con mejoras de color
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Configuración para que las imágenes no se vean descoloridas
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Limpiar contenedor antes de insertar (evita duplicados en recargas de desarrollo)
    this.canvasContainer.nativeElement.innerHTML = '';
    this.canvasContainer.nativeElement.appendChild(this.renderer.domElement);

    // 4. Luces
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    this.scene.add(this.galleryGroup);

    // 5. Creación de Cuadros
    const textureLoader = new THREE.TextureLoader();
    const planeGeo = new THREE.PlaneGeometry(this.CONFIG.pWidth, this.CONFIG.pHeight);
    const frameGeo = new THREE.BoxGeometry(this.CONFIG.pWidth + 0.8, this.CONFIG.pHeight + 0.8, 0.5);
    const frameMat = new THREE.MeshBasicMaterial({ color: this.CONFIG.frameColor });

    // Asegúrate de que esta ruta sea accesible desde tu servidor local
    const images = ['assets/pulsera.png', 'assets/pulsera.png', 'assets/pulsera.png'];

    for (let i = 0; i < this.CONFIG.slideCount; i++) {
      const group = new THREE.Group();
      group.position.set(i * this.CONFIG.spacingX, 0, 0);

      const texture = textureLoader.load(images[i]);
      texture.colorSpace = THREE.SRGBColorSpace; // Corrección de gama

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.z = 0.31;

      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.z = 0;

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

  @HostListener('window:wheel', ['$event'])
  onWheel(e: WheelEvent) {
    if (!this.isBrowser) return;
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

    // Suavizado de scroll (Lerp)
    this.currentScroll += (this.targetScroll - this.currentScroll) * this.CONFIG.lerpSpeed;

    const xMove = this.currentScroll * Math.cos(this.CONFIG.wallAngleY);
    const zMove = this.currentScroll * Math.sin(this.CONFIG.wallAngleY);

    this.camera.position.x = xMove;
    this.camera.position.z = this.CONFIG.camZ - zMove;

    // Sistema de carrusel infinito
    this.paintingGroups.forEach((group, i) => {
      const originalX = i * this.CONFIG.spacingX;
      const distFromCam = this.currentScroll - originalX;
      const shift = Math.round(distFromCam / this.totalWidth) * this.totalWidth;
      group.position.x = originalX + shift;
    });

    // Pequeño movimiento de cámara con el mouse
    this.camera.rotation.x = this.mouse.y * 0.05;
    this.camera.rotation.y = -this.mouse.x * 0.05;

    // Actualizar índice de diapositiva actual
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
}