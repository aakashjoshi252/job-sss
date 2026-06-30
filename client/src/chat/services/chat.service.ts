import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, ApiParams, Chat, Message, User } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { unwrapData, unwrapList } from '../../core/services/api-response';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly api = inject(ApiService);

  chats(): Observable<Chat[]> {
    return this.api.get<ApiEnvelope<Chat[]> | Chat[]>('/chat').pipe(map(unwrapList));
  }

  availableCandidates(): Observable<User[]> {
    return this.api.get<ApiEnvelope<User[]> | User[]>('/chat/candidates/available').pipe(map(unwrapList));
  }

  createOrGet(userId: string): Observable<Chat> {
    return this.api.post<ApiEnvelope<Chat> | Chat, { userId: string }>('/chat/create', { userId }).pipe(map(unwrapData));
  }

  get(chatId: string): Observable<Chat> {
    return this.api.get<ApiEnvelope<Chat> | Chat>(`/chat/${chatId}`).pipe(map(unwrapData));
  }

  messages(chatId: string, params?: ApiParams): Observable<Message[]> {
    return this.api.get<ApiEnvelope<Message[]> | Message[]>(`/chat/${chatId}/messages`, params).pipe(map(unwrapList));
  }

  send(chatId: string, text: string): Observable<Message> {
    return this.api.post<ApiEnvelope<Message> | Message, { text: string }>(`/chat/${chatId}/message`, { text }).pipe(map(unwrapData));
  }

  upload(chatId: string, file: File): Observable<Message> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.upload<ApiEnvelope<Message> | Message>(`/chat/${chatId}/attachment`, formData).pipe(map(unwrapData));
  }

  markChatRead(chatId: string): Observable<ApiEnvelope<unknown>> {
    return this.api.patch<ApiEnvelope<unknown>>(`/chat/${chatId}/read`);
  }

  downloadUrl(messageId: string): string {
    return this.api.downloadUrl(`/chat/download/${messageId}`);
  }
}
