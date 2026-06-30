import { ActionReducerMap } from '@ngrx/store';
import { AuthState, authReducer } from './auth/auth.reducer';
import {
  CollectionState,
  DashboardState,
  NotificationCollectionState,
  applicationsReducer,
  blogsReducer,
  chatReducer,
  companiesReducer,
  dashboardReducer,
  jobsReducer,
  notificationsReducer,
  subscriptionsReducer
} from './resources/resource.reducer';
import { Application, Blog, Chat, Company, Job, Subscription } from '../models';

export interface AppState {
  auth: AuthState;
  jobs: CollectionState<Job>;
  companies: CollectionState<Company>;
  applications: CollectionState<Application>;
  notifications: NotificationCollectionState;
  blogs: CollectionState<Blog>;
  chat: CollectionState<Chat>;
  subscriptions: CollectionState<Subscription>;
  dashboard: DashboardState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  jobs: jobsReducer,
  companies: companiesReducer,
  applications: applicationsReducer,
  notifications: notificationsReducer,
  blogs: blogsReducer,
  chat: chatReducer,
  subscriptions: subscriptionsReducer,
  dashboard: dashboardReducer
};
