import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Company } from '../../core/models';
import { CompanyService } from '../services/company.service';

@Component({
  selector: 'jc-companies-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="jc-container space-y-6 py-8">
      <div>
        <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Companies</p>
        <h1 class="mt-1 text-3xl font-semibold">Jewellery employers</h1>
      </div>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        @for (company of companies(); track company._id) {
          <a [routerLink]="['/company', company._id]" class="jc-panel p-4">
            <h2 class="font-semibold">{{ company.companyName }}</h2>
            <p class="mt-1 text-sm text-[var(--jc-muted)]">{{ company.industry || company.location || 'Jewellery' }}</p>
            <p class="mt-3 line-clamp-3 text-sm text-[var(--jc-muted)]">{{ company.description || '' }}</p>
          </a>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompaniesPageComponent implements OnInit {
  private readonly service = inject(CompanyService);
  readonly companies = signal<Company[]>([]);

  ngOnInit(): void {
    this.service.getCompanies().subscribe((companies) => this.companies.set(companies));
  }
}
