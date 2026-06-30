import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { LanguageService } from '../core/i18n/language.service';
import { AppState } from '../core/store/app.reducers';
import { AuthActions } from '../core/store/auth/auth.actions';
import { selectAuthUser, selectIsAuthenticated } from '../core/store/auth/auth.selectors';

@Component({
  selector: 'jc-public-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-[var(--jc-bg)] text-[var(--jc-ink)]">
      <header class="sticky top-0 z-40 border-b border-[var(--jc-line)] bg-[var(--jc-panel)]/95 backdrop-blur">
        <div class="jc-container flex min-h-16 items-center justify-between gap-4 py-3">
          <a routerLink="/" class="flex items-center gap-3 font-semibold">
            <img src="/assets/JewelCancy_logo.png" alt="JewelCancy" class="h-10 w-10 rounded object-contain" />
            <span>JewelCancy</span>
          </a>

          <nav class="hidden items-center gap-1 text-sm md:flex">
            @for (item of navItems; track item.href) {
              <a
                [routerLink]="item.href"
                routerLinkActive="bg-teal-50 text-teal-800 dark:bg-teal-950"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                class="rounded px-3 py-2 text-[var(--jc-muted)] hover:bg-slate-100 hover:text-[var(--jc-ink)] dark:hover:bg-slate-800"
              >
                {{ item.label }}
              </a>
            }
          </nav>

          <div class="flex items-center gap-2">
            <select
              class="jc-focus-ring rounded border border-[var(--jc-line)] bg-transparent px-2 py-2 text-sm"
              [value]="language.language()"
              (change)="setLanguage($event)"
              aria-label="Language"
            >
              @for (lang of language.languages; track lang.code) {
                <option [value]="lang.code">{{ lang.label }}</option>
              }
            </select>

            @if (isAuthenticated()) {
              <a [routerLink]="dashboardLink()" class="rounded bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">Dashboard</a>
              <button type="button" class="rounded border border-[var(--jc-line)] px-3 py-2 text-sm" (click)="logout()">Logout</button>
            } @else {
              <a routerLink="/login" class="rounded px-3 py-2 text-sm text-[var(--jc-muted)] hover:text-[var(--jc-ink)]">Login</a>
              <a routerLink="/register" class="rounded bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">Register</a>
            }
          </div>
        </div>
      </header>

      <main>
        <router-outlet />
      </main>

      <footer class="border-t border-[var(--jc-line)] bg-[var(--jc-panel)] py-8">
        <div class="jc-container flex flex-col gap-3 text-sm text-[var(--jc-muted)] md:flex-row md:items-center md:justify-between">
          <p>JewelCancy</p>
          <div class="flex gap-4">
            <a routerLink="/privacy-policy">Privacy</a>
            <a routerLink="/faq">FAQ</a>
            <a routerLink="/contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicLayoutComponent {
  readonly language = inject(LanguageService);
  private readonly store = inject(Store<AppState>);
  readonly user = toSignal(this.store.select(selectAuthUser), { initialValue: null });
  readonly isAuthenticated = toSignal(this.store.select(selectIsAuthenticated), { initialValue: false });

  readonly navItems = [
    { href: '/', label: 'Home', exact: true },
    { href: '/jobs', label: 'Jobs', exact: false },
    { href: '/companies', label: 'Companies', exact: false },
    { href: '/blogs', label: 'Blogs', exact: false },
    { href: '/about', label: 'About', exact: false },
    { href: '/contact', label: 'Contact', exact: false }
  ];

  setLanguage(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.language.use(target.value);
  }

  dashboardLink(): string {
    const role = this.user()?.role;
    if (role === 'admin') {
      return '/admin';
    }

    if (role === 'recruiter') {
      return '/recruiter/dashboard';
    }

    return '/candidate/home';
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
