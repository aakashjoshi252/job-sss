import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, ApiParams, Application, Company, DashboardStats, Job, Subscription, User } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { unwrapData, unwrapList } from '../../core/services/api-response';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  stats(): Observable<DashboardStats> {
    return this.api.get<ApiEnvelope<DashboardStats> | DashboardStats>('/admin/stats').pipe(map(unwrapData));
  }

  users(params?: ApiParams): Observable<User[]> {
    return this.api.get<ApiEnvelope<User[]> | User[]>('/admin/users', params).pipe(map(unwrapList));
  }

  companies(params?: ApiParams): Observable<Company[]> {
    return this.api.get<ApiEnvelope<Company[]> | Company[]>('/admin/companies', params).pipe(map(unwrapList));
  }

  jobs(params?: ApiParams): Observable<Job[]> {
    return this.api.get<ApiEnvelope<Job[]> | Job[]>('/admin/jobs', params).pipe(map(unwrapList));
  }

  applications(params?: ApiParams): Observable<Application[]> {
    return this.api.get<ApiEnvelope<Application[]> | Application[]>('/admin/applications', params).pipe(map(unwrapList));
  }

  subscriptions(params?: ApiParams): Observable<Subscription[]> {
    return this.api.get<ApiEnvelope<Subscription[]> | Subscription[]>('/admin/subscriptions', params).pipe(map(unwrapList));
  }
}
