import { EntityId, UploadAsset } from './api.model';

export interface Message {
  _id: EntityId;
  chatId: EntityId;
  senderId: EntityId;
  senderName?: string;
  text?: string;
  attachment?: UploadAsset;
  attachmentType?: 'image' | 'pdf' | 'document' | string;
  isRead?: boolean;
  seenAt?: string;
  editedAt?: string;
  createdAt?: string;
  readonly [key: string]: unknown;
}
