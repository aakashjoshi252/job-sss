import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { getSupportedLanguage } from './languages';

@Injectable()
export class HttpTranslateLoader implements TranslateLoader {
  private readonly http = inject(HttpClient);

  getTranslation(language: string): Observable<{ [key: string]: string | { [key: string]: string } }> {
    const code = getSupportedLanguage(language);
    return this.http.get<{ [key: string]: string | { [key: string]: string } }>(`/i18n/locales/${code}/translation.json`);
  }
}
