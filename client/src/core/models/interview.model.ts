import { EntityId } from './api.model';

export interface Interview {
  _id: EntityId;
  recruiterId: EntityId;
  candidateId?: EntityId;
  applicationId?: EntityId;
  jobId?: EntityId;
  scheduledAt: string;
  durationMinutes?: number;
  mode?: 'online' | 'offline' | 'phone' | string;
  meetingLink?: string;
  status?: 'scheduled' | 'completed' | 'cancelled' | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  readonly [key: string]: unknown;
}
