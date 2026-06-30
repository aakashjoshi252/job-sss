import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly requestCount = signal(0);
  readonly isLoading = computed(() => this.requestCount() > 0);

  start(): void {
    this.requestCount.update((count) => count + 1);
  }

  stop(): void {
    this.requestCount.update((count) => Math.max(0, count - 1));
  }
}
