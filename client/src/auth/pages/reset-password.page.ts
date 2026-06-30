import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'jc-reset-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="jc-container grid min-h-[calc(100vh-140px)] place-items-center py-10">
      <form class="jc-panel w-full max-w-md space-y-4 p-6" [formGroup]="form" (ngSubmit)="submit()">
        <h1 class="text-2xl font-semibold">Reset Password</h1>
        @if (message()) {
          <div class="rounded border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{{ message() }}</div>
        }
        <label class="block text-sm">
          <span>Email</span>
          <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" type="email" formControlName="email" />
        </label>
        <label class="block text-sm">
          <span>OTP</span>
          <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" formControlName="otp" />
        </label>
        <label class="block text-sm">
          <span>New Password</span>
          <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" type="password" formControlName="password" />
        </label>
        <button class="w-full rounded bg-teal-700 px-4 py-2 font-medium text-white" type="submit">Reset</button>
        <a routerLink="/login" class="block text-center text-sm text-teal-700">Login</a>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  readonly message = signal<string | null>(null);
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.auth.resetPassword(this.form.getRawValue()).subscribe((response) => {
      this.message.set(response.message ?? 'Password reset complete.');
    });
  }
}
