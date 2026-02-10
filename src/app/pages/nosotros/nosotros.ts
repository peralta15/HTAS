import { Component } from '@angular/core';
import { Headermenu } from '../../template/headermenu/headermenu';
import { Breadcrumbs } from '../../pages/breadcrumbs/breadcrumbs';
import { Footer } from "../../template/footer/footer";
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-nosotros',
  imports: [Headermenu, Breadcrumbs, Footer, ScrollRevealDirective],
  templateUrl: './nosotros.html',
  styleUrl: './nosotros.css',
})
export class Nosotros {

}
