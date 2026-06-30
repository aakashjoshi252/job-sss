import { createActionGroup, props } from '@ngrx/store';
import { ApiParams, Application, Blog, Chat, Company, DashboardStats, Job, Notification, Subscription } from '../../models';

export const JobsActions = createActionGroup({
  source: 'Jobs',
  events: {
    'Load': props<{ params?: ApiParams }>(),
    'Load Success': props<{ items: Job[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Select': props<{ id: string | null }>()
  }
});

export const CompaniesActions = createActionGroup({
  source: 'Companies',
  events: {
    'Load': props<{ params?: ApiParams }>(),
    'Load Success': props<{ items: Company[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Select': props<{ id: string | null }>()
  }
});

export const ApplicationsActions = createActionGroup({
  source: 'Applications',
  events: {
    'Load': props<{ params?: ApiParams }>(),
    'Load Success': props<{ items: Application[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Select': props<{ id: string | null }>()
  }
});

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    'Load': props<{ params?: ApiParams }>(),
    'Load Success': props<{ items: Notification[]; unreadCount?: number }>(),
    'Load Failure': props<{ error: string }>(),
    'Realtime Received': props<{ notification: Notification }>(),
    'Set Unread Count': props<{ count: number }>(),
    'Select': props<{ id: string | null }>()
  }
});

export const BlogsActions = createActionGroup({
  source: 'Blogs',
  events: {
    'Load': props<{ params?: ApiParams }>(),
    'Load Success': props<{ items: Blog[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Select': props<{ id: string | null }>()
  }
});

export const ChatActions = createActionGroup({
  source: 'Chat',
  events: {
    'Load': props<{ params?: ApiParams }>(),
    'Load Success': props<{ items: Chat[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Select': props<{ id: string | null }>()
  }
});

export const SubscriptionActions = createActionGroup({
  source: 'Subscription',
  events: {
    'Load': props<{ params?: ApiParams }>(),
    'Load Success': props<{ items: Subscription[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Select': props<{ id: string | null }>()
  }
});

export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    'Load': props<{ role: 'candidate' | 'recruiter' | 'admin' }>(),
    'Load Success': props<{ stats: DashboardStats }>(),
    'Load Failure': props<{ error: string }>()
  }
});
