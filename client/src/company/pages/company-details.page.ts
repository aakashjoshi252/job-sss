import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Company } from '../../core/models';
import { CompanyService } from '../services/company.service';

@Component({
  selector: 'jc-company-details-page',
  standalone: true,
  template: `
    <section class="jc-container py-8">
      @if (company(); as currentCompany) {
        <article class="jc-panel p-6">
          <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">{{ currentCompany.industry || 'Company' }}</p>
          <h1 class="mt-1 text-3xl font-semibold">{{ currentCompany.companyName }}</h1>
          <p class="mt-2 text-sm text-[var(--jc-muted)]">{{ currentCompany.location || '' }}</p>
          <p class="mt-6 max-w-3xl text-sm leading-6 text-[var(--jc-muted)]">{{ currentCompany.description || 'Company profile details will appear here.' }}</p>
        </article>
      } @else {
        <div class="jc-panel p-6 text-sm text-[var(--jc-muted)]">Loading company...</div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompanyDetailsPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CompanyService);
  readonly company = signal<Company | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('companyId');
    if (id) {
      this.service.getCompany(id).subscribe((company) => this.company.set(company));
    }
  }
}
