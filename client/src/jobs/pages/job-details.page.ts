import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Job } from '../../core/models';
import { JobService } from '../services/job.service';

@Component({
  selector: 'jc-job-details-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="jc-container py-8">
      @if (job(); as currentJob) {
        <article class="jc-panel p-6">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">{{ currentJob.profession || 'Job' }}</p>
              <h1 class="mt-1 text-3xl font-semibold">{{ currentJob.title }}</h1>
              <p class="mt-2 text-sm text-[var(--jc-muted)]">{{ currentJob.location || 'India' }}</p>
            </div>
            <a [routerLink]="['/candidate/job/apply', currentJob._id]" class="rounded bg-teal-700 px-4 py-2 text-sm font-medium text-white">Apply</a>
          </div>
          <div class="prose prose-slate mt-6 max-w-none dark:prose-invert">
            <p>{{ currentJob.description || currentJob.jobDescription || 'No description available.' }}</p>
          </div>
          @if (currentJob.skills?.length) {
            <div class="mt-6 flex flex-wrap gap-2">
              @for (skill of currentJob.skills; track skill) {
                <span class="rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{{ skill }}</span>
              }
            </div>
          }
        </article>
      } @else {
        <div class="jc-panel p-6 text-sm text-[var(--jc-muted)]">Loading job...</div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobDetailsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly jobService = inject(JobService);
  readonly job = signal<Job | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('jobId');
    if (id) {
      this.jobService.getJob(id).subscribe((job) => this.job.set(job));
    }
  }
}
