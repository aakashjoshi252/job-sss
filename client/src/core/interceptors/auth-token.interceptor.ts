import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LanguageService } from '../i18n/language.service';
import { StorageService } from '../services/storage.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/i18n/locales/')) {
    return next(req);
  }

  const storage = inject(StorageService);
  const language = inject(LanguageService);
  const token = storage.read('token');

  const headers: Record<string, string> = {
    'Accept-Language': language.language(),
    'X-Language': language.language()
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(req.clone({ setHeaders: headers }));
};
