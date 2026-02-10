import { Component, OnInit } from '@angular/core';
import { Headermenu } from "../../../template/headermenu/headermenu";
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Breadcrumbs } from "../../../pages/breadcrumbs/breadcrumbs";
import { Footer } from "../../../template/footer/footer";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [Headermenu, IonicModule, CommonModule, Breadcrumbs, Footer],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  isToggled = false;

  ngOnInit() {

  }

  toggleToSignUp() {
    this.isToggled = true;
  }

  toggleToSignIn() {
    this.isToggled = false;
  }

  onSubmitSignIn(event: Event) {
    event.preventDefault();
    console.log('Formulario de inicio de sesión enviado');
  }

  onSubmitSignUp(event: Event) {
    event.preventDefault();
    console.log('Formulario de registro enviado');
  }
}