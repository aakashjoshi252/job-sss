import { EntityId } from './api.model';

export interface Notification {
  _id: EntityId;
  title?: string;
  message: string;
  type?: string;
  recipient?: EntityId;
  recipientId?: EntityId;
  sender?: EntityId | null;
  senderId?: EntityId | null;
  relatedEntityId?: EntityId | null;
  relatedEntityType?: string | null;
  isRead: boolean;
  readAt?: string;
  createdAt?: string;
  readonly [key: string]: unknown;
}
