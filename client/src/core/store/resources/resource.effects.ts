import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { ApplicationService } from '../../../applications/services/application.service';
import { BlogService } from '../../../blogs/services/blog.service';
import { ChatService } from '../../../chat/services/chat.service';
import { CompanyService } from '../../../company/services/company.service';
import { DashboardService } from '../../../dashboard/services/dashboard.service';
import { JobService } from '../../../jobs/services/job.service';
import { NotificationService } from '../../../notification/services/notification.service';
import { SubscriptionService } from '../../../subscription/services/subscription.service';
import { getErrorMessage } from '../../services/api-response';
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

@Injectable()
export class ResourceEffects {
  private readonly actions$ = inject(Actions);
  private readonly jobs = inject(JobService);
  private readonly companies = inject(CompanyService);
  private readonly applications = inject(ApplicationService);
  private readonly notifications = inject(NotificationService);
  private readonly blogs = inject(BlogService);
  private readonly chat = inject(ChatService);
  private readonly subscriptions = inject(SubscriptionService);
  private readonly dashboard = inject(DashboardService);

  loadJobs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobsActions.load),
      switchMap(({ params }) =>
        this.jobs.getJobs(params).pipe(
          map((items) => JobsActions.loadSuccess({ items })),
          catchError((error: unknown) => of(JobsActions.loadFailure({ error: getErrorMessage(error) })))
        )
      )
    )
  );

  loadCompanies$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompaniesActions.load),
      switchMap(({ params }) =>
        this.companies.getCompanies(params).pipe(
          map((items) => CompaniesActions.loadSuccess({ items })),
          catchError((error: unknown) => of(CompaniesActions.loadFailure({ error: getErrorMessage(error) })))
        )
      )
    )
  );

  loadApplications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ApplicationsActions.load),
      switchMap(({ params }) =>
        this.applications.getMine(params).pipe(
          map((items) => ApplicationsActions.loadSuccess({ items })),
          catchError((error: unknown) => of(ApplicationsActions.loadFailure({ error: getErrorMessage(error) })))
        )
      )
    )
  );

  loadNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.load),
      switchMap(({ params }) =>
        forkJoin({
          items: this.notifications.list(params),
          unreadCount: this.notifications.unreadCount()
        }).pipe(
          map(({ items, unreadCount }) => NotificationsActions.loadSuccess({ items, unreadCount })),
          catchError((error: unknown) => of(NotificationsActions.loadFailure({ error: getErrorMessage(error) })))
        )
      )
    )
  );

  loadBlogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BlogsActions.load),
      switchMap(({ params }) =>
        this.blogs.getPublished(params).pipe(
          map((items) => BlogsActions.loadSuccess({ items })),
          catchError((error: unknown) => of(BlogsActions.loadFailure({ error: getErrorMessage(error) })))
        )
      )
    )
  );

  loadChat$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChatActions.load),
      switchMap(() =>
        this.chat.chats().pipe(
          map((items) => ChatActions.loadSuccess({ items })),
          catchError((error: unknown) => of(ChatActions.loadFailure({ error: getErrorMessage(error) })))
        )
      )
    )
  );

  loadSubscriptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SubscriptionActions.load),
      switchMap(() =>
        this.subscriptions.mySubscription().pipe(
          map((item) => SubscriptionActions.loadSuccess({ items: item ? [item] : [] })),
          catchError((error: unknown) => of(SubscriptionActions.loadFailure({ error: getErrorMessage(error) })))
        )
      )
    )
  );

  loadDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.load),
      switchMap(({ role }) => {
        const request = role === 'admin'
          ? this.dashboard.admin()
          : role === 'recruiter'
            ? this.dashboard.recruiter()
            : this.dashboard.candidate();

        return request.pipe(
          map((stats) => DashboardActions.loadSuccess({ stats })),
          catchError((error: unknown) => of(DashboardActions.loadFailure({ error: getErrorMessage(error) })))
        );
      })
    )
  );
}
