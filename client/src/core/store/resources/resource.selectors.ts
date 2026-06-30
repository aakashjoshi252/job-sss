import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  CollectionState,
  DashboardState,
  NotificationCollectionState,
  applicationsAdapter,
  blogsAdapter,
  chatAdapter,
  companiesAdapter,
  jobsAdapter,
  subscriptionsAdapter
} from './resource.reducer';
import { Application, Blog, Chat, Company, Job, Subscription } from '../../models';

const jobsState = createFeatureSelector<CollectionState<Job>>('jobs');
const companiesState = createFeatureSelector<CollectionState<Company>>('companies');
const applicationsState = createFeatureSelector<CollectionState<Application>>('applications');
const blogsState = createFeatureSelector<CollectionState<Blog>>('blogs');
const chatState = createFeatureSelector<CollectionState<Chat>>('chat');
const subscriptionsState = createFeatureSelector<CollectionState<Subscription>>('subscriptions');
const notificationsState = createFeatureSelector<NotificationCollectionState>('notifications');
export const selectDashboardState = createFeatureSelector<DashboardState>('dashboard');

export const jobsSelectors = jobsAdapter.getSelectors(jobsState);
export const companySelectors = companiesAdapter.getSelectors(companiesState);
export const applicationSelectors = applicationsAdapter.getSelectors(applicationsState);
export const blogSelectors = blogsAdapter.getSelectors(blogsState);
export const chatSelectors = chatAdapter.getSelectors(chatState);
export const subscriptionSelectors = subscriptionsAdapter.getSelectors(subscriptionsState);

export const selectJobsLoading = createSelector(jobsState, (state) => state.loading);
export const selectCompaniesLoading = createSelector(companiesState, (state) => state.loading);
export const selectApplicationsLoading = createSelector(applicationsState, (state) => state.loading);
export const selectBlogsLoading = createSelector(blogsState, (state) => state.loading);
export const selectChatLoading = createSelector(chatState, (state) => state.loading);
export const selectSubscriptionLoading = createSelector(subscriptionsState, (state) => state.loading);
export const selectNotificationsUnreadCount = createSelector(notificationsState, (state) => state.unreadCount);
export const selectDashboardStats = createSelector(selectDashboardState, (state) => state.stats);
