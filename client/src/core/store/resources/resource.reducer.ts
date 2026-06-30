import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { Application, Blog, Chat, Company, DashboardStats, Identified, Job, Notification, Subscription } from '../../models';
import {
  ApplicationsActions,
  BlogsActions,
  ChatActions,
  CompaniesActions,
  DashboardActions,
  JobsActions,
  NotificationsActions,
  SubscriptionActions
} from './resource.actions';

export interface CollectionState<T extends Identified> extends EntityState<T> {
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

export interface NotificationCollectionState extends CollectionState<Notification> {
  unreadCount: number;
}

export interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

const createAdapter = <T extends Identified>(): EntityAdapter<T> =>
  createEntityAdapter<T>({
    selectId: (entity) => entity._id,
    sortComparer: false
  });

export const jobsAdapter = createAdapter<Job>();
export const companiesAdapter = createAdapter<Company>();
export const applicationsAdapter = createAdapter<Application>();
export const notificationsAdapter = createAdapter<Notification>();
export const blogsAdapter = createAdapter<Blog>();
export const chatAdapter = createAdapter<Chat>();
export const subscriptionsAdapter = createAdapter<Subscription>();

const initialCollection = <T extends Identified>(adapter: EntityAdapter<T>): CollectionState<T> =>
  adapter.getInitialState({
    loading: false,
    error: null,
    selectedId: null
  });

export const jobsReducer = createReducer(
  initialCollection(jobsAdapter),
  on(JobsActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(JobsActions.loadSuccess, (state, { items }) => jobsAdapter.setAll(items, { ...state, loading: false })),
  on(JobsActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(JobsActions.select, (state, { id }) => ({ ...state, selectedId: id }))
);

export const companiesReducer = createReducer(
  initialCollection(companiesAdapter),
  on(CompaniesActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(CompaniesActions.loadSuccess, (state, { items }) => companiesAdapter.setAll(items, { ...state, loading: false })),
  on(CompaniesActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(CompaniesActions.select, (state, { id }) => ({ ...state, selectedId: id }))
);

export const applicationsReducer = createReducer(
  initialCollection(applicationsAdapter),
  on(ApplicationsActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(ApplicationsActions.loadSuccess, (state, { items }) => applicationsAdapter.setAll(items, { ...state, loading: false })),
  on(ApplicationsActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(ApplicationsActions.select, (state, { id }) => ({ ...state, selectedId: id }))
);

const initialNotifications: NotificationCollectionState = notificationsAdapter.getInitialState({
  loading: false,
  error: null,
  selectedId: null,
  unreadCount: 0
});

export const notificationsReducer = createReducer(
  initialNotifications,
  on(NotificationsActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(NotificationsActions.loadSuccess, (state, { items, unreadCount }) =>
    notificationsAdapter.setAll(items, { ...state, loading: false, unreadCount: unreadCount ?? state.unreadCount })
  ),
  on(NotificationsActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(NotificationsActions.realtimeReceived, (state, { notification }) =>
    notificationsAdapter.upsertOne(notification, {
      ...state,
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1
    })
  ),
  on(NotificationsActions.setUnreadCount, (state, { count }) => ({ ...state, unreadCount: Math.max(0, count) })),
  on(NotificationsActions.select, (state, { id }) => ({ ...state, selectedId: id }))
);

export const blogsReducer = createReducer(
  initialCollection(blogsAdapter),
  on(BlogsActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(BlogsActions.loadSuccess, (state, { items }) => blogsAdapter.setAll(items, { ...state, loading: false })),
  on(BlogsActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(BlogsActions.select, (state, { id }) => ({ ...state, selectedId: id }))
);

export const chatReducer = createReducer(
  initialCollection(chatAdapter),
  on(ChatActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(ChatActions.loadSuccess, (state, { items }) => chatAdapter.setAll(items, { ...state, loading: false })),
  on(ChatActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(ChatActions.select, (state, { id }) => ({ ...state, selectedId: id }))
);

export const subscriptionsReducer = createReducer(
  initialCollection(subscriptionsAdapter),
  on(SubscriptionActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(SubscriptionActions.loadSuccess, (state, { items }) => subscriptionsAdapter.setAll(items, { ...state, loading: false })),
  on(SubscriptionActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(SubscriptionActions.select, (state, { id }) => ({ ...state, selectedId: id }))
);

const initialDashboardState: DashboardState = {
  stats: null,
  loading: false,
  error: null
};

export const dashboardReducer = createReducer(
  initialDashboardState,
  on(DashboardActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(DashboardActions.loadSuccess, (state, { stats }) => ({ ...state, stats, loading: false })),
  on(DashboardActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error }))
);
