import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Notification } from '../../core/models';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'jc-notifications-page',
  standalone: true,
  template: `
    <section class="jc-container space-y-6 py-8">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Notifications</p>
          <h1 class="mt-1 text-3xl font-semibold">Updates</h1>
        </div>
        <button class="rounded border border-[var(--jc-line)] px-3 py-2 text-sm" type="button" (click)="markAllRead()">Mark all read</button>
      </div>
      <div class="space-y-3">
        @for (notification of notifications(); track notification._id) {
          <article class="jc-panel p-4" [class.opacity-70]="notification.isRead">
            <h2 class="font-semibold">{{ notification.title || notification.type || 'Notification' }}</h2>
            <p class="mt-1 text-sm text-[var(--jc-muted)]">{{ notification.message }}</p>
          </article>
        } @empty {
          <div class="jc-panel p-6 text-sm text-[var(--jc-muted)]">No notifications.</div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsPageComponent implements OnInit {
  private readonly service = inject(NotificationService);
  readonly notifications = signal<Notification[]>([]);

  ngOnInit(): void {
    this.load();
  }

  markAllRead(): void {
    this.service.markAllRead().subscribe(() => this.load());
  }

  private load(): void {
    this.service.list().subscribe((items) => this.notifications.set(items));
  }
}
