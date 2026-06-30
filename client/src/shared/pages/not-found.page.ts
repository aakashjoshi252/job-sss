import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'jc-not-found-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="jc-container py-16">
      <div class="jc-panel max-w-xl p-8">
        <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">404</p>
        <h1 class="mt-2 text-3xl font-semibold">Page not found</h1>
        <p class="mt-3 text-sm text-[var(--jc-muted)]">The page may have moved or the link is no longer available.</p>
        <a routerLink="/" class="mt-6 inline-flex rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white">Home</a>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPageComponent {}
