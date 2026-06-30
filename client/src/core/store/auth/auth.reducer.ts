import { createReducer, on } from '@ngrx/store';
import { AuthSession, User } from '../../models';
import { AuthActions } from './auth.actions';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const storedSession = (): AuthSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const userRaw = window.sessionStorage.getItem('user') ?? window.localStorage.getItem('user');
    const token = window.sessionStorage.getItem('token') ?? window.localStorage.getItem('token');
    const user = userRaw ? JSON.parse(userRaw) as User : null;
    return user && token ? { user, token } : null;
  } catch {
    return null;
  }
};

const initialSession = storedSession();

export const initialAuthState: AuthState = {
  user: initialSession?.user ?? null,
  token: initialSession?.token ?? null,
  isAuthenticated: Boolean(initialSession),
  loading: false,
  error: null
};

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.hydrateSession, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.sessionHydrated, (_state, { session }) => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: Boolean(session),
    loading: false,
    error: null
  })),
  on(AuthActions.login, AuthActions.register, AuthActions.loadMe, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, (state, { session }) => ({
    ...state,
    user: session.user,
    token: session.token,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  on(AuthActions.registerSuccess, (state) => ({ ...state, loading: false, error: null })),
  on(AuthActions.loadMeSuccess, (state, { user }) => ({ ...state, user, isAuthenticated: Boolean(state.token), loading: false })),
  on(AuthActions.loginFailure, AuthActions.registerFailure, AuthActions.loadMeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(AuthActions.logout, (state) => ({ ...state, loading: true })),
  on(AuthActions.logoutSuccess, () => ({ ...initialAuthState, user: null, token: null, isAuthenticated: false, loading: false })),
  on(AuthActions.updateUser, (state, { user }) => ({
    ...state,
    user: state.user ? { ...state.user, ...user } : null
  })),
  on(AuthActions.clearError, (state) => ({ ...state, error: null }))
);
