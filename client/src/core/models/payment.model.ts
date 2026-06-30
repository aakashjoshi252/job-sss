import { EntityId } from './api.model';

export interface Payment {
  _id: EntityId;
  recruiterId?: EntityId;
  planId?: EntityId;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  currency?: string;
  status?: 'created' | 'paid' | 'failed' | string;
  createdAt?: string;
  readonly [key: string]: unknown;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
}
