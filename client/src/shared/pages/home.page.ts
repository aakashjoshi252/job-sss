import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Company, Job } from '../../core/models';
import { CompanyService } from '../../company/services/company.service';
import { JobService } from '../../jobs/services/job.service';

@Component({
  selector: 'jc-home-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="border-b border-[var(--jc-line)] bg-[var(--jc-panel)]">
      <div class="jc-container grid gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Jewellery Recruitment</p>
          <h1 class="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">JewelCancy</h1>
          <p class="mt-4 max-w-2xl text-base text-[var(--jc-muted)]">
            Hiring and career workflows for jewellery businesses, recruiters, and skilled candidates.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a routerLink="/jobs" class="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white">Browse Jobs</a>
            <a routerLink="/register" class="rounded border border-[var(--jc-line)] px-4 py-2 text-sm font-medium">Create Account</a>
          </div>
        </div>
        <div class="jc-panel grid gap-3 p-4">
          @for (job of jobs(); track job._id) {
            <a [routerLink]="['/jobs', job._id]" class="rounded border border-[var(--jc-line)] p-4 hover:border-teal-400">
              <h2 class="font-semibold">{{ job.title }}</h2>
              <p class="mt-1 text-sm text-[var(--jc-muted)]">{{ job.location || 'India' }}</p>
            </a>
          }
        </div>
      </div>
    </section>

    <section class="jc-container py-10">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-2xl font-semibold">Companies</h2>
        <a routerLink="/companies" class="text-sm font-medium text-teal-700">View all</a>
      </div>
      <div class="grid gap-3 md:grid-cols-3">
        @for (company of companies(); track company._id) {
          <a [routerLink]="['/company', company._id]" class="jc-panel p-4">
            <h3 class="font-semibold">{{ company.companyName }}</h3>
            <p class="mt-1 text-sm text-[var(--jc-muted)]">{{ company.industry || company.location || 'Jewellery' }}</p>
          </a>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent implements OnInit {
  private readonly jobsService = inject(JobService);
  private readonly companyService = inject(CompanyService);
  readonly jobs = signal<Job[]>([]);
  readonly companies = signal<Company[]>([]);

  ngOnInit(): void {
    this.jobsService.getFeatured({ limit: 4 }).subscribe((jobs) => this.jobs.set(jobs.slice(0, 4)));
    this.companyService.getTopCompanies({ limit: 6 }).subscribe((companies) => this.companies.set(companies.slice(0, 6)));
  }
}
