import { Component } from '@angular/core';
import { Headermenu } from "../../template/headermenu/headermenu";
import { Footer } from "../../template/footer/footer";

@Component({
  selector: 'app-pagos',
  imports: [Headermenu, Footer],
  templateUrl: './pagos.html',
  styleUrl: './pagos.css',
})
export class Pagos {

}
