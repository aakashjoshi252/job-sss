import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, ApiParams, Notification } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { unwrapList } from '../../core/services/api-response';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);

  list(params?: ApiParams): Observable<Notification[]> {
    return this.api.get<ApiEnvelope<Notification[]> | Notification[]>('/notifications', params).pipe(map(unwrapList));
  }

  unreadCount(): Observable<number> {
    return this.api.get<ApiEnvelope<{ unreadCount?: number; count?: number }>>('/notifications/unread-count').pipe(
      map((response) => response.data?.unreadCount ?? response.data?.count ?? response.unreadCount ?? 0)
    );
  }

  markRead(id: string): Observable<ApiEnvelope<Notification>> {
    return this.api.patch<ApiEnvelope<Notification>>(`/notifications/${id}/read`);
  }

  markUnread(id: string): Observable<ApiEnvelope<Notification>> {
    return this.api.patch<ApiEnvelope<Notification>>(`/notifications/${id}/unread`);
  }

  markAllRead(): Observable<ApiEnvelope<unknown>> {
    return this.api.patch<ApiEnvelope<unknown>>('/notifications/mark-all-read');
  }

  delete(id: string): Observable<ApiEnvelope<unknown>> {
    return this.api.delete<ApiEnvelope<unknown>>(`/notifications/${id}`);
  }

  clearAll(): Observable<ApiEnvelope<unknown>> {
    return this.api.delete<ApiEnvelope<unknown>>('/notifications/clear-all');
  }
}
