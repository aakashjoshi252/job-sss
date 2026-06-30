import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { UserRole } from '../../models';
import { getErrorMessage } from '../../services/api-response';
import { AuthActions } from './auth.actions';

const dashboardForRole = (role: UserRole): string => {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'recruiter') {
    return '/recruiter/dashboard';
  }

  return '/candidate/home';
};

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  hydrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.hydrateSession),
      map(() => AuthActions.sessionHydrated({ session: this.authService.getStoredSession() }))
    )
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ credentials }) =>
        this.authService.login(credentials).pipe(
          map((session) => AuthActions.loginSuccess({ session })),
          catchError((error: unknown) => of(AuthActions.loginFailure({ error: getErrorMessage(error) })))
        )
      )
    )
  );

  afterLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ session }) => {
          void this.router.navigateByUrl(dashboardForRole(session.user.role));
        })
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ payload }) =>
        this.authService.register(payload).pipe(
          map((user) => AuthActions.registerSuccess({ user })),
          catchError((error: unknown) => of(AuthActions.registerFailure({ error: getErrorMessage(error) })))
        )
      )
    )
  );

  afterRegister$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(({ user }) => {
          void this.router.navigate(['/email-verify'], { queryParams: { email: user.email } });
        })
      ),
    { dispatch: false }
  );

  me$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadMe),
      switchMap(() =>
        this.authService.me().pipe(
          map((user) => AuthActions.loadMeSuccess({ user })),
          catchError((error: unknown) => of(AuthActions.loadMeFailure({ error: getErrorMessage(error) })))
        )
      )
    )
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => {
            this.authService.clearSession();
            return of(AuthActions.logoutSuccess());
          })
        )
      )
    )
  );

  afterLogout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => {
          void this.router.navigateByUrl('/login');
        })
      ),
    { dispatch: false }
  );
}
