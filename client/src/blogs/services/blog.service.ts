import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, ApiParams, Blog, BlogComment } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { unwrapData, unwrapList } from '../../core/services/api-response';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly api = inject(ApiService);

  getPublished(params?: ApiParams): Observable<Blog[]> {
    return this.api.get<ApiEnvelope<Blog[]> | Blog[]>('/blogs/published', params).pipe(map(unwrapList));
  }

  search(query: string, params?: ApiParams): Observable<Blog[]> {
    return this.api.get<ApiEnvelope<Blog[]> | Blog[]>('/blogs/search', { ...params, query }).pipe(map(unwrapList));
  }

  getById(id: string): Observable<Blog> {
    return this.api.get<ApiEnvelope<Blog> | Blog>(`/blogs/${id}`).pipe(map(unwrapData));
  }

  getBySlug(slug: string): Observable<Blog> {
    return this.api.get<ApiEnvelope<Blog> | Blog>(`/blogs/slug/${slug}`).pipe(map(unwrapData));
  }

  getCompanyBlogs(companyId: string, params?: ApiParams): Observable<Blog[]> {
    return this.api.get<ApiEnvelope<Blog[]> | Blog[]>(`/blogs/company/${companyId}`, params).pipe(map(unwrapList));
  }

  create(blog: Partial<Blog> | FormData): Observable<Blog> {
    return this.api.post<ApiEnvelope<Blog> | Blog, Partial<Blog> | FormData>('/blogs', blog).pipe(map(unwrapData));
  }

  update(id: string, blog: Partial<Blog> | FormData): Observable<Blog> {
    return this.api.patch<ApiEnvelope<Blog> | Blog, Partial<Blog> | FormData>(`/blogs/${id}`, blog).pipe(map(unwrapData));
  }

  like(id: string): Observable<ApiEnvelope<Blog>> {
    return this.api.post<ApiEnvelope<Blog>>(`/blogs/${id}/like`);
  }

  bookmark(id: string): Observable<ApiEnvelope<Blog>> {
    return this.api.post<ApiEnvelope<Blog>>(`/blogs/${id}/bookmark`);
  }

  comments(id: string): Observable<BlogComment[]> {
    return this.api.get<ApiEnvelope<BlogComment[]> | BlogComment[]>(`/blogs/${id}/comments`).pipe(map(unwrapList));
  }

  comment(id: string, text: string): Observable<BlogComment> {
    return this.api.post<ApiEnvelope<BlogComment> | BlogComment, { text: string }>(`/blogs/${id}/comments`, { text }).pipe(map(unwrapData));
  }
}
