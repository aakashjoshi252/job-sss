import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  get local(): Storage | null {
    return this.isBrowser ? window.localStorage : null;
  }

  get session(): Storage | null {
    return this.isBrowser ? window.sessionStorage : null;
  }

  read(key: string): string | null {
    return this.session?.getItem(key) ?? this.local?.getItem(key) ?? null;
  }

  write(key: string, value: string, persist = true): void {
    this.session?.setItem(key, value);
    if (persist) {
      this.local?.setItem(key, value);
    }
  }

  remove(key: string): void {
    this.session?.removeItem(key);
    this.local?.removeItem(key);
  }

  readJson<T>(key: string): T | null {
    const raw = this.read(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  writeJson<T>(key: string, value: T, persist = true): void {
    this.write(key, JSON.stringify(value), persist);
  }
}
