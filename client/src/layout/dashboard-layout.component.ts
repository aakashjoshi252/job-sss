import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppState } from '../core/store/app.reducers';
import { AuthActions } from '../core/store/auth/auth.actions';
import { selectAuthUser } from '../core/store/auth/auth.selectors';
import { UserRole } from '../core/models';

interface DashboardNavItem {
  href: string;
  label: string;
}

@Component({
  selector: 'jc-dashboard-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-[var(--jc-bg)] text-[var(--jc-ink)]">
      <aside class="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-[var(--jc-line)] bg-[var(--jc-panel)] p-4 lg:block">
        <a routerLink="/" class="mb-6 flex items-center gap-3 font-semibold">
          <img src="/assets/JewelCancy_logo.png" alt="JewelCancy" class="h-10 w-10 rounded object-contain" />
          <span>JewelCancy</span>
        </a>
        <nav class="space-y-1">
          @for (item of navItems(); track item.href) {
            <a
              [routerLink]="item.href"
              routerLinkActive="bg-teal-50 text-teal-800 dark:bg-teal-950"
              class="block rounded px-3 py-2 text-sm text-[var(--jc-muted)] hover:bg-slate-100 hover:text-[var(--jc-ink)] dark:hover:bg-slate-800"
            >
              {{ item.label }}
            </a>
          }
        </nav>
      </aside>

      <div class="lg:pl-72">
        <header class="sticky top-0 z-30 border-b border-[var(--jc-line)] bg-[var(--jc-panel)]/95 backdrop-blur">
          <div class="flex min-h-16 items-center justify-between gap-4 px-4 py-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-[var(--jc-muted)]">{{ role() }}</p>
              <h1 class="text-lg font-semibold">Dashboard</h1>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <a routerLink="/notifications" class="rounded border border-[var(--jc-line)] px-3 py-2">Notifications</a>
              <a routerLink="/profile" class="hidden rounded border border-[var(--jc-line)] px-3 py-2 sm:block">{{ user()?.username || 'Profile' }}</a>
              <button type="button" class="rounded bg-slate-900 px-3 py-2 text-white dark:bg-slate-100 dark:text-slate-900" (click)="logout()">Logout</button>
            </div>
          </div>
        </header>

        <main class="px-4 py-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardLayoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store<AppState>);
  readonly user = toSignal(this.store.select(selectAuthUser), { initialValue: null });

  role(): UserRole {
    return (this.route.snapshot.data['role'] as UserRole | undefined) ?? this.user()?.role ?? 'candidate';
  }

  navItems(): DashboardNavItem[] {
    const role = this.role();
    if (role === 'admin') {
      return [
        { href: '/admin', label: 'Overview' },
        { href: '/admin/users', label: 'Users' },
        { href: '/admin/companies', label: 'Companies' },
        { href: '/admin/jobs', label: 'Jobs' },
        { href: '/admin/applications', label: 'Applications' },
        { href: '/admin/subscriptions', label: 'Subscriptions' },
        { href: '/admin/blogs', label: 'Blogs' },
        { href: '/admin/reports', label: 'Reports' },
        { href: '/admin/settings', label: 'Settings' }
      ];
    }

    if (role === 'recruiter') {
      return [
        { href: '/recruiter/dashboard', label: 'Overview' },
        { href: '/recruiter/company/registration', label: 'Company' },
        { href: '/recruiter/jobpost', label: 'Post Job' },
        { href: '/recruiter/postedjobs', label: 'Manage Jobs' },
        { href: '/recruiter/candidates-list', label: 'Applicants' },
        { href: '/recruiter/ats-board', label: 'ATS Board' },
        { href: '/recruiter/interview-scheduler', label: 'Interviews' },
        { href: '/recruiter/chat', label: 'Chat' },
        { href: '/recruiter/subscription', label: 'Subscription' },
        { href: '/recruiter/analytics', label: 'Analytics' }
      ];
    }

    return [
      { href: '/candidate/home', label: 'Overview' },
      { href: '/candidate/jobs', label: 'Jobs' },
      { href: '/candidate/applications', label: 'Applications' },
      { href: '/candidate/saved-jobs', label: 'Saved Jobs' },
      { href: '/candidate/resume', label: 'Resume' },
      { href: '/candidate/chat', label: 'Chat' },
      { href: '/candidate/notifications', label: 'Notifications' },
      { href: '/candidate/settings', label: 'Settings' }
    ];
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
