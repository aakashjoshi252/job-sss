import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { AppState } from '../store/app.reducers';
import { selectAuthUser, selectIsAuthenticated } from '../store/auth/auth.selectors';

export const guestGuard: CanActivateFn = () => {
  const store = inject(Store<AppState>);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return true;
      }

      let redirect = '/candidate/home';
      store.select(selectAuthUser).pipe(take(1)).subscribe((user) => {
        redirect = user?.role === 'admin' ? '/admin' : user?.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/home';
      });

      return router.createUrlTree([redirect]);
    })
  );
};
