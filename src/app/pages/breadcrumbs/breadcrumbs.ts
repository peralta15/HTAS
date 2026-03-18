import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NgFor, NgIf } from '@angular/common';
import { Headermenu } from "../../template/headermenu/headermenu";

type Crumb = {
  label: string; // El texto que se mostrará.
  url: string;   // La URL a la que redirige.
};

@Component({
  selector: 'app-breadcrumbs',
  imports: [NgFor, NgIf, RouterModule],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.css',
})
export class Breadcrumbs implements OnDestroy {
  // Array que almacenará las migas de pan actuales.
  crumbs: Crumb[] = [];
  // Variable para guardar la suscripción a los eventos del router.
  // El '!' indica que se inicializará definidamente antes de usarse.
  private subscription!: Subscription;
  // Propiedad de ejemplo (parece no usada o de prueba).



  // Inyección de dependencias del servicio Router.
  constructor(private router: Router) {
    // Nos suscribimos a los eventos del router.
    this.subscription = this.router.events
      .pipe(
        // Filtramos solo los eventos de tipo NavigationEnd.
        // Esto evita reconstruir los breadcrumbs en cada etapa de la navegación (start, resolve, etc.).
        filter((event) => event instanceof NavigationEnd)
      )
      // Cada vez que termina una navegación, reconstruimos los breadcrumbs.
      .subscribe(() => this.buildBreadcrumbs());

    // Llamamos a construir los breadcrumbs inicialmente para cargar el estado actual al iniciar el componente.
    this.buildBreadcrumbs();
  }

  // Método privado para construir la lista de migas de pan basada en la URL actual.
  private buildBreadcrumbs(): void {
    // Obtiene la URL actual y elimina parámetros de consulta (?) y fragmentos (#).
    const url = this.router.url.split('?')[0].split('#')[0];
    // Divide la URL en segmentos usando '/' y filtra cadenas vacías (Boolean elimina '').
    const segments = url.split('/').filter(Boolean);

    // Mapa de traducción para segmentos específicos de la URL a nombres legibles.
    const labelMap: Record<string, string> = {
      landing: 'Inicio',
      nosotros: 'Acerca de',
      login: 'Iniciar Sesión',
    };

    // Inicializa los breadcrumbs siempre con el "Inicio".
    const breadcrumbs: Crumb[] = [{ label: 'Inicio', url: '/' }];

    let currentUrl = '';
    // Itera sobre cada segmento de la URL.
    for (const segment of segments) {
      // Reconstruye la URL acumulativa para cada paso.
      currentUrl += `/${segment}`;
      // Agrega la miga de pan al array.
      breadcrumbs.push({
        // Si el segmento está en el mapa, usa la traducción; si no, lo formatea automáticamente.
        label: labelMap[segment] ?? this.formatLabel(segment),
        url: currentUrl,
      });
    }

    // Actualiza la propiedad de la clase con los nuevos breadcrumbs.
    this.crumbs = breadcrumbs;
  }

  // Método auxiliar para formatear segmentos de URL en texto legible (ej: 'mi-pagina' -> 'Mi Pagina').
  private formatLabel(text: string): string {
    return text
      .replace(/-/g, ' ') // Reemplaza guiones con espacios.
      .replace(/\b\w/g, (letter) => letter.toUpperCase()); // Capitaliza la primera letra de cada palabra.
  }
  // Se ejecuta cuando el componente se destruye.
  ngOnDestroy(): void {
    // Es crucial desuscribirse para evitar fugas de memoria (memory leaks).
    this.subscription.unsubscribe();
  }
}
