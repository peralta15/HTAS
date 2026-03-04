import 'zone.js/node';
import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app';  // Asegúrate que es AppComponent
import { config } from './app/app.config.server';

// La función bootstrap debe recibir el contexto
const bootstrap = (context: BootstrapContext) => 
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;