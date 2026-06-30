import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, DashboardStats } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { unwrapData } from '../../core/services/api-response';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  candidate(): Observable<DashboardStats> {
    return this.api.get<ApiEnvelope<DashboardStats> | DashboardStats>('/dashboard/candidate').pipe(map(unwrapData));
  }

  recruiter(): Observable<DashboardStats> {
    return this.api.get<ApiEnvelope<DashboardStats> | DashboardStats>('/dashboard/recruiter').pipe(map(unwrapData));
  }

  admin(): Observable<DashboardStats> {
    return this.api.get<ApiEnvelope<DashboardStats> | DashboardStats>('/dashboard/admin').pipe(map(unwrapData));
  }

  adminStats(): Observable<DashboardStats> {
    return this.api.get<ApiEnvelope<DashboardStats> | DashboardStats>('/admin/stats').pipe(map(unwrapData));
  }
}
