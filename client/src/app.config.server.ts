import { mergeApplicationConfig, type ApplicationConfig } from '@angular/core';
import { provideServerRendering, RenderMode, type ServerRoute, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';

const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];

const serverOnlyConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes))
  ]
};

export const serverConfig = mergeApplicationConfig(appConfig, serverOnlyConfig);
