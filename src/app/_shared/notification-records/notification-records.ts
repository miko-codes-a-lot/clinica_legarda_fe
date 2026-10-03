import { Component, DestroyRef, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { catchError, distinctUntilChanged, EMPTY, finalize, startWith, Subject, switchMap } from 'rxjs';
import { GenericTableComponent } from '../component/table/generic-table.component';
import { TableCellDirective } from '../component/table/table-cell.directive';
import { NOTIFICATION_COLUMNS, NOTIFICATION_FILTERS, notificationDay, notificationLink, NotificationArea } from '../component/table/notification-table-config';
import { AuthService } from '../service/auth-service';
import { NotificationService } from '../service/notification-service';
import { Notification } from '../model/notification';
import { Icon } from '../ui/icon/icon';

@Component({
  selector: 'app-notification-records',
  imports: [CommonModule, GenericTableComponent, TableCellDirective, Icon],
  templateUrl: './notification-records.html',
})
export class NotificationRecords {
  @Input() area: NotificationArea = 'admin';
  private readonly auth = inject(AuthService);
  private readonly service = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refreshes = new Subject<void>();
  readonly columns = NOTIFICATION_COLUMNS;
  readonly filters = NOTIFICATION_FILTERS;
  readonly dateValue = notificationDay;
  rows: Notification[] = [];
  isLoading = false;
  error = '';
  scopeKey = '';
  readonly pendingReads = new Set<string>();

  ngOnInit(): void {
    this.service.notifications$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(items => {
      if (this.auth.currentUserValue) this.setRows(items);
    });
    this.auth.currentUser$.pipe(
      distinctUntilChanged((previous, current) => previous?._id === current?._id && previous?.role === current?.role),
      switchMap(user => {
        this.rows = [];
        this.pendingReads.clear();
        this.scopeKey = user ? `${user._id}:${user.role}` : '';
        this.error = '';
        this.isLoading = false;
        return user ? this.refreshes.pipe(startWith(undefined), switchMap(() => {
          this.isLoading = true;
          this.error = '';
          return this.service.getAllNotifications().pipe(
            catchError(() => { this.error = 'Notifications could not be loaded. Please retry.'; return EMPTY; }),
            finalize(() => this.isLoading = false),
          );
        })) : EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(items => this.setRows(items));
  }
  private setRows(items: readonly Notification[]): void {
    this.rows = items.map(item => ({ ...item, link: notificationLink(item.link, this.area) ?? undefined }));
  }
  retry(): void { this.refreshes.next(); }
  markAsRead(item: Notification): void {
    if (item.read || this.pendingReads.has(item._id)) return;
    this.pendingReads.add(item._id);
    this.service.markAsRead(item._id).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.pendingReads.delete(item._id))).subscribe({
      error: () => this.error = 'This notification could not be marked as read. Please try again.',
    });
  }
}
