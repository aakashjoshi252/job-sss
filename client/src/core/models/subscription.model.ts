import { EntityId } from './api.model';

export interface Subscription {
  _id: EntityId;
  recruiterId?: EntityId;
  planId?: EntityId;
  planName?: string;
  status?: 'active' | 'expired' | 'cancelled' | string;
  startedAt?: string;
  expiresAt?: string;
  jobPostLimit?: number;
  jobPostsUsed?: number;
  readonly [key: string]: unknown;
}

export interface SubscriptionPlan {
  _id: EntityId;
  name: string;
  price: number;
  currency?: string;
  durationDays?: number;
  jobPostLimit?: number;
  features?: string[];
  readonly [key: string]: unknown;
}
