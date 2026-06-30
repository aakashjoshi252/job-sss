import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, Resume } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { unwrapData, unwrapList } from '../../core/services/api-response';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private readonly api = inject(ApiService);

  getCandidateResume(candidateId: string): Observable<Resume> {
    return this.api.get<ApiEnvelope<Resume> | Resume>(`/resume/${candidateId}`).pipe(map(unwrapData));
  }

  create(payload: Partial<Resume>): Observable<Resume> {
    return this.api.post<ApiEnvelope<Resume> | Resume, Partial<Resume>>('/resume/create', payload).pipe(map(unwrapData));
  }

  update(id: string, payload: Partial<Resume>): Observable<Resume> {
    return this.api.put<ApiEnvelope<Resume> | Resume, Partial<Resume>>(`/resume/update/${id}`, payload).pipe(map(unwrapData));
  }

  builderList(): Observable<Resume[]> {
    return this.api.get<ApiEnvelope<Resume[]> | Resume[]>('/pdf').pipe(map(unwrapList));
  }

  builderCreate(payload: Partial<Resume>): Observable<Resume> {
    return this.api.post<ApiEnvelope<Resume> | Resume, Partial<Resume>>('/pdf/create', payload).pipe(map(unwrapData));
  }

  downloadUrl(resumeId: string): string {
    return this.api.downloadUrl(`/pdf/${resumeId}/download`);
  }
}
