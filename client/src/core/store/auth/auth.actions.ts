import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuthSession, LoginCredentials, RegisterPayload, User } from '../../models';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Hydrate Session': emptyProps(),
    'Session Hydrated': props<{ session: AuthSession | null }>(),
    'Login': props<{ credentials: LoginCredentials }>(),
    'Login Success': props<{ session: AuthSession }>(),
    'Login Failure': props<{ error: string }>(),
    'Register': props<{ payload: RegisterPayload }>(),
    'Register Success': props<{ user: User }>(),
    'Register Failure': props<{ error: string }>(),
    'Load Me': emptyProps(),
    'Load Me Success': props<{ user: User }>(),
    'Load Me Failure': props<{ error: string }>(),
    'Logout': emptyProps(),
    'Logout Success': emptyProps(),
    'Update User': props<{ user: Partial<User> }>(),
    'Clear Error': emptyProps()
  }
});
