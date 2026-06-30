import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Job } from '../../core/models';
import { JobService } from '../services/job.service';

@Component({
  selector: 'jc-jobs-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="jc-container space-y-6 py-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Jobs</p>
          <h1 class="mt-1 text-3xl font-semibold">Jewellery openings</h1>
        </div>
        <form [formGroup]="filters" class="grid gap-2 sm:grid-cols-3">
          <input class="jc-focus-ring rounded border border-[var(--jc-line)] bg-transparent px-3 py-2 text-sm" placeholder="Search" formControlName="search" />
          <input class="jc-focus-ring rounded border border-[var(--jc-line)] bg-transparent px-3 py-2 text-sm" placeholder="Location" formControlName="location" />
          <input class="jc-focus-ring rounded border border-[var(--jc-line)] bg-transparent px-3 py-2 text-sm" placeholder="Profession" formControlName="profession" />
        </form>
      </div>

      @if (loading()) {
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          @for (item of skeletons; track item) {
            <div class="h-40 animate-pulse rounded border border-[var(--jc-line)] bg-[var(--jc-panel)]"></div>
          }
        </div>
      } @else {
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          @for (job of jobs(); track job._id) {
            <article class="jc-panel flex min-h-48 flex-col justify-between p-4">
              <div>
                <h2 class="text-lg font-semibold">{{ job.title }}</h2>
                <p class="mt-1 text-sm text-[var(--jc-muted)]">{{ job.location || 'India' }}</p>
                <p class="mt-3 line-clamp-3 text-sm text-[var(--jc-muted)]">{{ job.description || job.jobDescription || 'Role details available inside.' }}</p>
              </div>
              <div class="mt-4 flex items-center justify-between gap-3">
                <span class="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">{{ job.jobType || job.profession || 'Jewellery' }}</span>
                <a [routerLink]="['/jobs', job._id]" class="rounded bg-teal-700 px-3 py-2 text-sm font-medium text-white">View</a>
              </div>
            </article>
          } @empty {
            <div class="jc-panel p-6 text-sm text-[var(--jc-muted)] md:col-span-2 xl:col-span-3">No matching jobs found.</div>
          }
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobsPageComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly jobService = inject(JobService);
  readonly jobs = signal<Job[]>([]);
  readonly loading = signal(false);
  readonly skeletons = [1, 2, 3, 4, 5, 6];
  readonly filters = this.fb.group({
    search: [''],
    location: [''],
    profession: ['']
  });

  ngOnInit(): void {
    this.load();
    this.filters.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => this.load());
  }

  private load(): void {
    this.loading.set(true);
    this.jobService.getJobs(this.filters.getRawValue()).subscribe({
      next: (jobs) => {
        this.jobs.set(jobs);
        this.loading.set(false);
      },
      error: () => {
        this.jobs.set([]);
        this.loading.set(false);
      }
    });
  }
}
