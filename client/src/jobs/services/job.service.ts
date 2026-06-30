import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, ApiParams, Job, SavedJob } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { unwrapData, unwrapList } from '../../core/services/api-response';

@Injectable({ providedIn: 'root' })
export class JobService {
  private readonly api = inject(ApiService);

  getJobs(params?: ApiParams): Observable<Job[]> {
    return this.api.get<ApiEnvelope<Job[]> | Job[]>('/jobs', params).pipe(map(unwrapList));
  }

  getFeatured(params?: ApiParams): Observable<Job[]> {
    return this.api.get<ApiEnvelope<Job[]> | Job[]>('/jobs/featured', params).pipe(map(unwrapList));
  }

  getRecommended(params?: ApiParams): Observable<Job[]> {
    return this.api.get<ApiEnvelope<Job[]> | Job[]>('/jobs/candidate/recommended', params).pipe(map(unwrapList));
  }

  getJob(id: string): Observable<Job> {
    return this.api.get<ApiEnvelope<Job> | Job>(`/jobs/${id}`).pipe(map(unwrapData));
  }

  getByRecruiter(recruiterId: string, params?: ApiParams): Observable<Job[]> {
    return this.api.get<ApiEnvelope<Job[]> | Job[]>(`/jobs/recruiter/${recruiterId}`, params).pipe(map(unwrapList));
  }

  getByCompany(companyId: string, params?: ApiParams): Observable<Job[]> {
    return this.api.get<ApiEnvelope<Job[]> | Job[]>(`/jobs/company/${companyId}`, params).pipe(map(unwrapList));
  }

  create(job: Partial<Job> | FormData): Observable<Job> {
    return this.api.post<ApiEnvelope<Job> | Job, Partial<Job> | FormData>('/jobs', job).pipe(map(unwrapData));
  }

  update(id: string, job: Partial<Job> | FormData): Observable<Job> {
    return this.api.put<ApiEnvelope<Job> | Job, Partial<Job> | FormData>(`/jobs/${id}`, job).pipe(map(unwrapData));
  }

  delete(id: string): Observable<ApiEnvelope<unknown>> {
    return this.api.delete<ApiEnvelope<unknown>>(`/jobs/${id}`);
  }

  getSavedJobs(): Observable<SavedJob[]> {
    return this.api.get<ApiEnvelope<SavedJob[]> | SavedJob[]>('/jobs/saved-jobs').pipe(map(unwrapList));
  }

  saveJob(jobId: string): Observable<SavedJob> {
    return this.api.post<ApiEnvelope<SavedJob> | SavedJob, { jobId: string }>('/jobs/saved-jobs', { jobId }).pipe(map(unwrapData));
  }
}
