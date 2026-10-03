import { Component } from '@angular/core';
import { NotificationRecords } from '../../../_shared/notification-records/notification-records';
import { NotificationArea } from '../../../_shared/component/table/notification-table-config';

@Component({
  selector: 'app-notification-list',
  imports: [NotificationRecords],
  template: '<app-notification-records [area]="area" />',
})
export class NotificationList {
  readonly area: NotificationArea = 'dentist';
}
