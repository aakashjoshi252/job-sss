import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppState } from '../../core/store/app.reducers';
import { AuthActions } from '../../core/store/auth/auth.actions';
import { selectAuthError, selectAuthLoading } from '../../core/store/auth/auth.selectors';

@Component({
  selector: 'jc-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="jc-container grid min-h-[calc(100vh-140px)] place-items-center py-10">
      <form class="jc-panel w-full max-w-2xl space-y-4 p-6" [formGroup]="form" (ngSubmit)="submit()">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Join JewelCancy</p>
          <h1 class="mt-1 text-2xl font-semibold">Register</h1>
        </div>

        @if (error()) {
          <div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error() }}</div>
        }

        <div class="grid gap-4 md:grid-cols-2">
          <label class="block text-sm">
            <span>Name</span>
            <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" formControlName="username" />
          </label>
          <label class="block text-sm">
            <span>Email</span>
            <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" type="email" formControlName="email" />
          </label>
          <label class="block text-sm">
            <span>Phone</span>
            <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" formControlName="phone" />
          </label>
          <label class="block text-sm">
            <span>Role</span>
            <select class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" formControlName="role">
              <option value="candidate">Candidate</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </label>
          @if (form.controls.role.value === 'candidate') {
            <label class="block text-sm md:col-span-2">
              <span>Job Profession</span>
              <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" formControlName="jobProfession" />
            </label>
          }
          <label class="block text-sm md:col-span-2">
            <span>Password</span>
            <input class="jc-focus-ring mt-1 w-full rounded border border-[var(--jc-line)] bg-transparent px-3 py-2" type="password" formControlName="password" />
          </label>
        </div>

        <button type="submit" class="w-full rounded bg-teal-700 px-4 py-2 font-medium text-white disabled:opacity-60" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Creating account...' : 'Register' }}
        </button>

        <p class="text-sm text-[var(--jc-muted)]">Already registered? <a routerLink="/login" class="text-teal-700">Login</a></p>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(Store<AppState>);
  readonly loading = toSignal(this.store.select(selectAuthLoading), { initialValue: false });
  readonly error = toSignal(this.store.select(selectAuthError), { initialValue: null });

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    role: ['candidate' as const, [Validators.required]],
    jobProfession: [''],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.store.dispatch(AuthActions.register({
      payload: {
        username: value.username,
        email: value.email,
        phone: value.phone,
        role: value.role,
        password: value.password,
        jobProfession: value.role === 'candidate' ? value.jobProfession : undefined
      }
    }));
  }
}
