import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'jc-verify-email-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="jc-container grid min-h-[calc(100vh-140px)] place-items-center py-10">
      <form class="jc-panel w-full max-w-md space-y-4 p-6" [formGroup]="form" (ngSubmit)="submit()">
        <h1 class="text-2xl font-semibold">Email Verification</h1>
        @if (message()) {
          <div class="rounded border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{{ message() }}</div>
        }
        @if (error()) {
          <div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error() }}</div>
        }
        <label class="block text-sm">
          <span>Email</span>
          <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" type="email" formControlName="email" />
        </label>
        <label class="block text-sm">
          <span>OTP</span>
          <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" formControlName="otp" />
        </label>
        <button class="w-full rounded bg-teal-700 px-4 py-2 font-medium text-white" type="submit">Verify</button>
        <button class="w-full rounded border border-[var(--jc-line)] px-4 py-2 text-sm" type="button" (click)="resend()">Resend OTP</button>
        <a routerLink="/login" class="block text-center text-sm text-teal-700">Login</a>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyEmailPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
    otp: ['', [Validators.required]]
  });

  submit(): void {
    this.auth.verifyEmail(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.message.set(response.message ?? 'Email verified successfully.');
        this.error.set(null);
      },
      error: (error: unknown) => {
        this.error.set(error instanceof Error ? error.message : 'Verification failed.');
      }
    });
  }

  resend(): void {
    const email = this.form.controls.email.value;
    this.auth.resendOtp(email).subscribe({
      next: (response) => this.message.set(response.message ?? 'OTP sent.'),
      error: () => this.error.set('Unable to resend OTP.')
    });
  }
}
