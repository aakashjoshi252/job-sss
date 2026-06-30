import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiEnvelope, ApiParams, Payment, PaymentOrder, Subscription, SubscriptionPlan } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { unwrapData, unwrapList } from '../../core/services/api-response';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly api = inject(ApiService);

  plans(): Observable<SubscriptionPlan[]> {
    return this.api.get<ApiEnvelope<SubscriptionPlan[]> | SubscriptionPlan[]>('/subscription/plans').pipe(map(unwrapList));
  }

  plan(planId: string): Observable<SubscriptionPlan> {
    return this.api.get<ApiEnvelope<SubscriptionPlan> | SubscriptionPlan>(`/subscription/plans/${planId}`).pipe(map(unwrapData));
  }

  createOrder(planId: string): Observable<PaymentOrder> {
    return this.api.post<ApiEnvelope<PaymentOrder> | PaymentOrder, { planId: string }>('/subscription/create-order', { planId }).pipe(map(unwrapData));
  }

  verifyPayment(payload: Record<string, string>): Observable<Payment> {
    return this.api.post<ApiEnvelope<Payment> | Payment, Record<string, string>>('/subscription/verify-payment', payload).pipe(map(unwrapData));
  }

  mySubscription(): Observable<Subscription> {
    return this.api.get<ApiEnvelope<Subscription> | Subscription>('/subscription/my-subscription').pipe(map(unwrapData));
  }

  transactions(params?: ApiParams): Observable<Payment[]> {
    return this.api.get<ApiEnvelope<Payment[]> | Payment[]>('/subscription/transactions', params).pipe(map(unwrapList));
  }

  transaction(paymentId: string): Observable<Payment> {
    return this.api.get<ApiEnvelope<Payment> | Payment>(`/subscription/transactions/${paymentId}`).pipe(map(unwrapData));
  }

  usage(): Observable<Record<string, unknown>> {
    return this.api.get<ApiEnvelope<Record<string, unknown>> | Record<string, unknown>>('/subscription/usage').pipe(map(unwrapData));
  }
}
