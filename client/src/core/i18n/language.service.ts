import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, getLanguageMeta, getSupportedLanguage, supportedLanguages } from './languages';
import { StorageService } from '../services/storage.service';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly storage = inject(StorageService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly currentLanguage = signal(this.detectInitialLanguage());

  readonly languages = supportedLanguages;
  readonly language = this.currentLanguage.asReadonly();
  readonly direction = computed(() => getLanguageMeta(this.currentLanguage()).dir);

  initialize(): void {
    this.translate.addLangs(this.languages.map((language) => language.code));
    this.translate.setFallbackLang(DEFAULT_LANGUAGE);
    this.use(this.currentLanguage());
  }

  use(languageCode: string): void {
    const language = getSupportedLanguage(languageCode);
    this.currentLanguage.set(language);
    this.storage.write(LANGUAGE_STORAGE_KEY, language);
    this.translate.use(language);
    this.document.documentElement.lang = language;
    this.document.documentElement.dir = getLanguageMeta(language).dir;
  }

  private detectInitialLanguage(): string {
    const stored = this.storage.read(LANGUAGE_STORAGE_KEY);
    if (stored) {
      return getSupportedLanguage(stored);
    }

    if (this.isBrowser) {
      return getSupportedLanguage(window.navigator.language);
    }

    return DEFAULT_LANGUAGE;
  }
}
