import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { UserRole } from '../models';
import { AppState } from '../store/app.reducers';
import { selectAuthUser, selectIsAuthenticated } from '../store/auth/auth.selectors';

export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated): boolean | UrlTree =>
      isAuthenticated ? true : router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } })
    )
  );
};

export const roleGuard = (roles: readonly UserRole[]): CanActivateFn => (_route, state) => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectAuthUser).pipe(
    take(1),
    map((user): boolean | UrlTree => {
      if (!user) {
        return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
      }

      if (roles.includes(user.role)) {
        return true;
      }

      return router.createUrlTree([dashboardForRole(user.role)]);
    })
  );
};

const dashboardForRole = (role: UserRole): string => {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'recruiter') {
    return '/recruiter/dashboard';
  }

  return '/candidate/home';
};
