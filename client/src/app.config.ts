import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { routes } from './app.routes';
import { SelectivePreloadingStrategy } from './core/routing/selective-preloading.strategy';
import { authErrorInterceptor } from './core/interceptors/auth-error.interceptor';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { refreshTokenInterceptor } from './core/interceptors/refresh-token.interceptor';
import { HttpTranslateLoader } from './core/i18n/http-translate-loader';
import { reducers } from './core/store/app.reducers';
import { effects } from './core/store/app.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(SelectivePreloadingStrategy),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      })
    ),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        authTokenInterceptor,
        refreshTokenInterceptor,
        loadingInterceptor,
        authErrorInterceptor
      ])
    ),
    provideStore(reducers),
    provideEffects(effects),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      connectInZone: true
    }),
    provideTranslateService({
      fallbackLang: 'en',
      lang: 'en',
      loader: provideTranslateLoader(HttpTranslateLoader)
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
