import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApplicationService } from '../../applications/services/application.service';

@Component({
  selector: 'jc-job-apply-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="jc-container py-8">
      <form class="jc-panel max-w-2xl space-y-4 p-6" [formGroup]="form" (ngSubmit)="submit()">
        <h1 class="text-2xl font-semibold">Apply for job</h1>
        @if (message()) {
          <div class="rounded border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{{ message() }}</div>
        }
        <label class="block text-sm">
          <span>Cover Letter</span>
          <textarea class="jc-focus-ring mt-1 min-h-40 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" formControlName="coverLetter"></textarea>
        </label>
        <button class="rounded bg-teal-700 px-4 py-2 font-medium text-white" type="submit">Submit</button>
        <a routerLink="/candidate/applications" class="ml-3 text-sm text-teal-700">Applications</a>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobApplyPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ApplicationService);
  readonly message = signal<string | null>(null);
  readonly form = this.fb.group({
    coverLetter: ['']
  });

  submit(): void {
    const jobId = this.route.snapshot.paramMap.get('jobId');
    if (!jobId) {
      this.message.set('Job is required.');
      return;
    }

    this.service.apply({ jobId, coverLetter: this.form.controls.coverLetter.value }).subscribe(() => {
      this.message.set('Application submitted.');
    });
  }
}
