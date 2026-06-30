import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiEnvelope, AuthSession, LoginCredentials, RegisterPayload, ResetPasswordPayload, User, VerificationPayload } from '../../core/models';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';

interface LoginResponse extends ApiEnvelope<{ user?: User; token?: string }> {
  user?: User;
  token?: string;
}

interface UserResponse extends ApiEnvelope<{ user?: User }> {
  user?: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);

  login(credentials: LoginCredentials): Observable<AuthSession> {
    return this.api.post<LoginResponse, LoginCredentials>('/user/login', credentials).pipe(
      map((response) => this.toSession(response)),
      tap((session) => this.persistSession(session, credentials.remember ?? true))
    );
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.api.post<UserResponse, RegisterPayload>('/user/register', payload).pipe(
      map((response) => response.user ?? response.data?.user ?? response.data as User)
    );
  }

  verifyEmail(payload: VerificationPayload): Observable<ApiEnvelope<unknown>> {
    return this.api.post<ApiEnvelope<unknown>, VerificationPayload>('/user/verify-email', payload);
  }

  resendOtp(email: string): Observable<ApiEnvelope<unknown>> {
    return this.api.post<ApiEnvelope<unknown>, { email: string }>('/user/resend-otp', { email });
  }

  forgotPassword(email: string): Observable<ApiEnvelope<unknown>> {
    return this.api.post<ApiEnvelope<unknown>, { email: string }>('/user/forgot-password', { email });
  }

  resetPassword(payload: ResetPasswordPayload): Observable<ApiEnvelope<unknown>> {
    return this.api.post<ApiEnvelope<unknown>, ResetPasswordPayload>('/user/reset-password', payload);
  }

  me(): Observable<User> {
    return this.api.get<UserResponse>('/user/me').pipe(
      map((response) => response.user ?? response.data?.user ?? response.data as User)
    );
  }

  logout(): Observable<ApiEnvelope<unknown>> {
    return this.api.post<ApiEnvelope<unknown>>('/user/logout').pipe(
      tap(() => this.clearSession())
    );
  }

  getStoredSession(): AuthSession | null {
    const user = this.storage.readJson<User>('user');
    const token = this.storage.read('token');
    return user && token ? { user, token } : null;
  }

  persistSession(session: AuthSession, persist = true): void {
    this.storage.writeJson('user', session.user, persist);
    this.storage.write('token', session.token, persist);
  }

  clearSession(): void {
    this.storage.remove('user');
    this.storage.remove('token');
    this.storage.remove('company');
  }

  private toSession(response: LoginResponse): AuthSession {
    const user = response.user ?? response.data?.user;
    const token = response.token ?? response.data?.token;

    if (!user || !token) {
      throw new Error(response.message ?? 'Login response did not include a user session.');
    }

    return { user, token };
  }
}
