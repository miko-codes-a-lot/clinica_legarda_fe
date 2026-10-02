import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: `<span class="ui-status" [attr.data-status]="status.toLowerCase()">{{ status.replaceAll('_', ' ') }}</span>`,
})
export class StatusBadge {
  @Input() status = '';
}
