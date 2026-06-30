import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, switchMap, takeUntil, of, catchError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { unwrapList } from '../../core/services/api-response';

interface FeaturePageData {
  title: string;
  eyebrow?: string;
  description?: string;
  endpoint?: string;
  actions?: readonly { label: string; href: string }[];
}

@Component({
  selector: 'jc-feature-shell-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="jc-container space-y-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          @if (page().eyebrow) {
            <p class="text-xs font-semibold uppercase tracking-wide text-teal-700">{{ page().eyebrow }}</p>
          }
          <h1 class="mt-1 text-2xl font-semibold md:text-3xl">{{ page().title }}</h1>
          @if (page().description) {
            <p class="mt-2 max-w-3xl text-sm text-[var(--jc-muted)]">{{ page().description }}</p>
          }
        </div>
        @if (page().actions?.length) {
          <div class="flex flex-wrap gap-2">
            @for (action of page().actions; track action.href) {
              <a [routerLink]="action.href" class="rounded bg-teal-700 px-3 py-2 text-sm font-medium text-white">{{ action.label }}</a>
            }
          </div>
        }
      </div>

      @if (loading()) {
        <div class="grid gap-3 md:grid-cols-3">
          @for (item of skeletons; track item) {
            <div class="h-32 animate-pulse rounded border border-[var(--jc-line)] bg-[var(--jc-panel)]"></div>
          }
        </div>
      } @else if (error()) {
        <div class="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{{ error() }}</div>
      } @else if (records().length) {
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          @for (record of records(); track recordId(record, $index)) {
            <article class="jc-panel p-4">
              <div class="mb-3 flex items-start justify-between gap-3">
                <h2 class="text-base font-semibold">{{ displayTitle(record) }}</h2>
                @if (displayStatus(record)) {
                  <span class="rounded bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">{{ displayStatus(record) }}</span>
                }
              </div>
              <p class="line-clamp-3 text-sm text-[var(--jc-muted)]">{{ displaySummary(record) }}</p>
            </article>
          }
        </div>
      } @else {
        <div class="jc-panel p-6 text-sm text-[var(--jc-muted)]">No records found.</div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatureShellPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly destroy$ = new Subject<void>();

  readonly page = signal<FeaturePageData>({ title: 'JewelCancy' });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly records = signal<readonly Record<string, unknown>[]>([]);
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  ngOnInit(): void {
    this.route.data
      .pipe(
        switchMap((data) => {
          const page = data as FeaturePageData;
          this.page.set(page);
          this.records.set([]);
          this.error.set(null);

          if (!page.endpoint) {
            return of([]);
          }

          this.loading.set(true);
          return this.api.get<unknown>(page.endpoint).pipe(
            catchError((error: unknown) => {
              this.error.set(error instanceof Error ? error.message : 'Unable to load this module.');
              return of([]);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.records.set(this.toRecords(response));
        this.loading.set(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  recordId(record: Record<string, unknown>, index: number): string {
    return String(record['_id'] ?? record['id'] ?? index);
  }

  displayTitle(record: Record<string, unknown>): string {
    return String(record['title'] ?? record['companyName'] ?? record['username'] ?? record['name'] ?? record['email'] ?? 'Record');
  }

  displaySummary(record: Record<string, unknown>): string {
    return String(record['description'] ?? record['message'] ?? record['content'] ?? record['location'] ?? record['role'] ?? '');
  }

  displayStatus(record: Record<string, unknown>): string {
    return String(record['status'] ?? record['accountStatus'] ?? record['role'] ?? '');
  }

  private toRecords(response: unknown): Record<string, unknown>[] {
    const list = unwrapList<Record<string, unknown>>(response as Record<string, unknown>[] | { data?: { items?: Record<string, unknown>[]; docs?: Record<string, unknown>[] }; items?: Record<string, unknown>[]; docs?: Record<string, unknown>[] });
    return list.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  }
}
