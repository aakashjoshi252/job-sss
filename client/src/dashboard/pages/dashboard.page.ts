import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserRole } from '../../core/models';
import { AppState } from '../../core/store/app.reducers';
import { DashboardActions } from '../../core/store/resources/resource.actions';
import { selectDashboardStats } from '../../core/store/resources/resource.selectors';

@Component({
  selector: 'jc-dashboard-page',
  standalone: true,
  imports: [KeyValuePipe],
  template: `
    <section class="jc-container space-y-6">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">{{ role }}</p>
        <h1 class="mt-1 text-3xl font-semibold">Overview</h1>
      </div>
      @if (stats(); as currentStats) {
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          @for (stat of currentStats | keyvalue; track stat.key) {
            <article class="jc-panel p-4">
              <p class="text-sm text-[var(--jc-muted)]">{{ stat.key }}</p>
              <p class="mt-2 text-2xl font-semibold">{{ stat.value }}</p>
            </article>
          }
        </div>
      } @else {
        <div class="grid gap-3 md:grid-cols-4">
          @for (item of skeletons; track item) {
            <div class="h-28 animate-pulse rounded border border-[var(--jc-line)] bg-[var(--jc-panel)]"></div>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(Store<AppState>);
  readonly stats = toSignal(this.store.select(selectDashboardStats), { initialValue: null });
  readonly skeletons = [1, 2, 3, 4];
  role: UserRole = 'candidate';

  ngOnInit(): void {
    this.role = (this.route.snapshot.data['role'] as UserRole | undefined) ?? 'candidate';
    this.store.dispatch(DashboardActions.load({ role: this.role }));
  }
}
