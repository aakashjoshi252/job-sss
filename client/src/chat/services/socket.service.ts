import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { ChatStatusEvent, Message, TypingEvent } from '../../core/models';
import { StorageService } from '../../core/services/storage.service';

type ServerToClientEvents = {
  receiveMessage: (message: Message) => void;
  newMessage: (message: Message) => void;
  newMessageNotification: (payload: Record<string, unknown>) => void;
  userTyping: (payload: TypingEvent) => void;
  userStoppedTyping: (payload: TypingEvent) => void;
  userStatusChange: (payload: ChatStatusEvent) => void;
  messageError: (payload: { error?: string }) => void;
  joinedChat: (payload: { chatId: string; success: boolean }) => void;
  leftChat: (payload: { chatId: string; success: boolean }) => void;
};

type EventPayload<K extends keyof ServerToClientEvents> = Parameters<ServerToClientEvents[K]>[0];
type SocketListener<K extends keyof ServerToClientEvents> = (payload: EventPayload<K>) => void;

type ClientToServerEvents = {
  userOnline: () => void;
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (payload: { chatId: string; text: string }) => void;
  typing: (payload: { chatId: string }) => void;
  stopTyping: (payload: { chatId: string }) => void;
};

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private readonly storage = inject(StorageService);
  private socket: Socket | null = null;
  private readonly connectedSignal = signal(false);

  readonly connected = computed(() => this.connectedSignal());

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.storage.read('token');
    if (!token) {
      return;
    }

    this.socket = io(environment.socketUrl || undefined, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    this.socket.on('connect', () => {
      this.connectedSignal.set(true);
      this.socket?.emit('userOnline');
    });

    this.socket.on('disconnect', () => this.connectedSignal.set(false));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectedSignal.set(false);
  }

  join(chatId: string): void {
    this.connect();
    this.socket?.emit('joinChat', chatId);
  }

  leave(chatId: string): void {
    this.socket?.emit('leaveChat', chatId);
  }

  sendMessage(chatId: string, text: string): void {
    this.socket?.emit('sendMessage', { chatId, text });
  }

  typing(chatId: string): void {
    this.socket?.emit('typing', { chatId });
  }

  stopTyping(chatId: string): void {
    this.socket?.emit('stopTyping', { chatId });
  }

  onMessage(): Observable<Message> {
    return this.fromEvent('receiveMessage');
  }

  onTyping(): Observable<TypingEvent> {
    return this.fromEvent('userTyping');
  }

  onStoppedTyping(): Observable<TypingEvent> {
    return this.fromEvent('userStoppedTyping');
  }

  onStatus(): Observable<ChatStatusEvent> {
    return this.fromEvent('userStatusChange');
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private fromEvent<K extends keyof ServerToClientEvents>(eventName: K): Observable<Parameters<ServerToClientEvents[K]>[0]> {
    return new Observable((observer) => {
      this.connect();
      const handler: SocketListener<K> = (payload) => observer.next(payload);
      this.socket?.on(String(eventName), handler);

      return () => {
        this.socket?.off(String(eventName), handler);
      };
    });
  }
}
