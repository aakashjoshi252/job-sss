import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, ApiParams, Company, DashboardStats } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { unwrapData, unwrapList } from '../../core/services/api-response';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly api = inject(ApiService);

  getCompanies(params?: ApiParams): Observable<Company[]> {
    return this.api.get<ApiEnvelope<Company[]> | Company[]>('/company', params).pipe(map(unwrapList));
  }

  getTopCompanies(params?: ApiParams): Observable<Company[]> {
    return this.api.get<ApiEnvelope<Company[]> | Company[]>('/company/top', params).pipe(map(unwrapList));
  }

  getCompany(id: string): Observable<Company> {
    return this.api.get<ApiEnvelope<Company> | Company>(`/company/${id}`).pipe(map(unwrapData));
  }

  getByRecruiter(recruiterId: string): Observable<Company> {
    return this.api.get<ApiEnvelope<Company> | Company>(`/company/recruiter/${recruiterId}`).pipe(map(unwrapData));
  }

  getStats(companyId: string): Observable<DashboardStats> {
    return this.api.get<ApiEnvelope<DashboardStats> | DashboardStats>(`/company/${companyId}/stats`).pipe(map(unwrapData));
  }

  create(company: Partial<Company> | FormData): Observable<Company> {
    return this.api.post<ApiEnvelope<Company> | Company, Partial<Company> | FormData>('/company', company).pipe(map(unwrapData));
  }

  update(id: string, company: Partial<Company> | FormData): Observable<Company> {
    return this.api.put<ApiEnvelope<Company> | Company, Partial<Company> | FormData>(`/company/update/${id}`, company).pipe(map(unwrapData));
  }
}
