import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { withRoutes } from '@angular/ssr';
import { provideServerRendering } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes))
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);