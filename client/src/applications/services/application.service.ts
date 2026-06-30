import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, ApiParams, Application, ApplicationTimelineItem } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { unwrapData, unwrapList } from '../../core/services/api-response';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly api = inject(ApiService);

  getMine(params?: ApiParams): Observable<Application[]> {
    return this.api.get<ApiEnvelope<Application[]> | Application[]>('/application', params).pipe(map(unwrapList));
  }

  getByRecruiter(recruiterId: string, params?: ApiParams): Observable<Application[]> {
    return this.api.get<ApiEnvelope<Application[]> | Application[]>(`/application/recruiter/${recruiterId}`, params).pipe(map(unwrapList));
  }

  getRecentByRecruiter(recruiterId: string): Observable<Application[]> {
    return this.api.get<ApiEnvelope<Application[]> | Application[]>(`/application/recruiter/${recruiterId}/recent`).pipe(map(unwrapList));
  }

  getByJob(jobId: string): Observable<Application[]> {
    return this.api.get<ApiEnvelope<Application[]> | Application[]>(`/application/job/${jobId}`).pipe(map(unwrapList));
  }

  get(id: string): Observable<Application> {
    return this.api.get<ApiEnvelope<Application> | Application>(`/application/${id}`).pipe(map(unwrapData));
  }

  apply(payload: Partial<Application> | FormData): Observable<Application> {
    return this.api.post<ApiEnvelope<Application> | Application, Partial<Application> | FormData>('/application', payload).pipe(map(unwrapData));
  }

  updateStatus(applicationId: string, status: string): Observable<Application> {
    return this.api.patch<ApiEnvelope<Application> | Application, { status: string }>(`/application/${applicationId}/status`, { status }).pipe(map(unwrapData));
  }

  withdraw(applicationId: string): Observable<ApiEnvelope<unknown>> {
    return this.api.delete<ApiEnvelope<unknown>>(`/application/${applicationId}/withdraw`);
  }

  timeline(applicationId: string): Observable<ApplicationTimelineItem[]> {
    return this.api.get<ApiEnvelope<ApplicationTimelineItem[]> | ApplicationTimelineItem[]>(`/candidate/applications/${applicationId}/timeline`).pipe(map(unwrapList));
  }
}
