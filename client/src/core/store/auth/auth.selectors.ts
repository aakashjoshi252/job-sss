import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectAuthUser = createSelector(selectAuthState, (state) => state.user);
export const selectAuthToken = createSelector(selectAuthState, (state) => state.token);
export const selectIsAuthenticated = createSelector(selectAuthState, (state) => state.isAuthenticated && Boolean(state.token));
export const selectAuthLoading = createSelector(selectAuthState, (state) => state.loading);
export const selectAuthError = createSelector(selectAuthState, (state) => state.error);
export const selectUserRole = createSelector(selectAuthUser, (user) => user?.role ?? null);
