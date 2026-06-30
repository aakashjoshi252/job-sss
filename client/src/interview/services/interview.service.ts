import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, ApiParams, Interview } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { unwrapData, unwrapList } from '../../core/services/api-response';

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly api = inject(ApiService);

  list(params?: ApiParams): Observable<Interview[]> {
    return this.api.get<ApiEnvelope<Interview[]> | Interview[]>('/interviews', params).pipe(map(unwrapList));
  }

  upcoming(recruiterId: string): Observable<Interview[]> {
    return this.api.get<ApiEnvelope<Interview[]> | Interview[]>(`/interviews/recruiter/${recruiterId}/upcoming`).pipe(map(unwrapList));
  }

  get(id: string): Observable<Interview> {
    return this.api.get<ApiEnvelope<Interview> | Interview>(`/interviews/${id}`).pipe(map(unwrapData));
  }

  create(payload: Partial<Interview>): Observable<Interview> {
    return this.api.post<ApiEnvelope<Interview> | Interview, Partial<Interview>>('/interviews', payload).pipe(map(unwrapData));
  }

  update(id: string, payload: Partial<Interview>): Observable<Interview> {
    return this.api.patch<ApiEnvelope<Interview> | Interview, Partial<Interview>>(`/interviews/${id}`, payload).pipe(map(unwrapData));
  }

  updateStatus(id: string, status: string): Observable<Interview> {
    return this.api.patch<ApiEnvelope<Interview> | Interview, { status: string }>(`/interviews/${id}/status`, { status }).pipe(map(unwrapData));
  }
}
