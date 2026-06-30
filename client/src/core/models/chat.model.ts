import { EntityId } from './api.model';
import { Message } from './message.model';
import { User } from './user.model';

export interface Chat {
  _id: EntityId;
  participants: readonly (EntityId | User)[];
  lastMessage?: Message | string;
  unreadCount?: number;
  isOnline?: boolean;
  createdAt?: string;
  updatedAt?: string;
  readonly [key: string]: unknown;
}

export interface ChatStatusEvent {
  userId: EntityId;
  status: 'online' | 'offline';
  timestamp?: string;
}

export interface TypingEvent {
  chatId: EntityId;
  userName?: string;
}
