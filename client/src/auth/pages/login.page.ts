import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppState } from '../../core/store/app.reducers';
import { AuthActions } from '../../core/store/auth/auth.actions';
import { selectAuthError, selectAuthLoading } from '../../core/store/auth/auth.selectors';

@Component({
  selector: 'jc-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="jc-container grid min-h-[calc(100vh-140px)] place-items-center py-10">
      <form class="jc-panel w-full max-w-md space-y-4 p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Welcome back</p>
          <h1 class="mt-1 text-2xl font-semibold">Login</h1>
        </div>

        @if (error()) {
          <div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error() }}</div>
        }

        <label class="block text-sm">
          <span>Email</span>
          <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" type="email" formControlName="email" />
        </label>

        <label class="block text-sm">
          <span>Password</span>
          <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" type="password" formControlName="password" />
        </label>

        <label class="flex items-center gap-2 text-sm text-[var(--jc-muted)]">
          <input type="checkbox" formControlName="remember" />
          <span>Keep me signed in</span>
        </label>

        <button type="submit" class="w-full rounded bg-teal-700 px-4 py-2 font-medium text-white disabled:opacity-60" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Signing in...' : 'Login' }}
        </button>

        <div class="flex justify-between text-sm">
          <a routerLink="/forgot-password" class="text-teal-700">Forgot password?</a>
          <a routerLink="/register" class="text-teal-700">Register</a>
        </div>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(Store<AppState>);
  readonly loading = toSignal(this.store.select(selectAuthLoading), { initialValue: false });
  readonly error = toSignal(this.store.select(selectAuthError), { initialValue: null });

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [true]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.dispatch(AuthActions.login({ credentials: this.form.getRawValue() }));
  }
}
