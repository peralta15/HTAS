import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCnYZoq0GBL8EmP20X081k41x6LXoGTk00",
  authDomain: "autenticacion-9d1dc.firebaseapp.com",
  projectId: "autenticacion-9d1dc",
  storageBucket: "autenticacion-9d1dc.firebasestorage.app",
  messagingSenderId: "377227345815",
  appId: "1:377227345815:web:f3d167dffb374a72304ed2"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),

    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),

    importProvidersFrom(
      AngularFireModule.initializeApp(firebaseConfig),
      AngularFirestoreModule
    )
  ]
};