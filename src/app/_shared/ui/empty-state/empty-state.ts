import { Icon } from '../icon/icon';
import { Component, Input } from '@angular/core';

@Component({
  imports: [Icon],
  selector: 'app-empty-state',
  template: `
    <div class="ui-empty">
      <app-icon class="mb-3 !size-8 text-accent" aria-hidden="true" [name]="icon" />
      <h2 class="text-base font-semibold text-ink">{{ title }}</h2>
      @if (description) { <p class="ui-muted mx-auto mt-2 max-w-md">{{ description }}</p> }
      <div class="mt-4"><ng-content /></div>
    </div>
  `,
})
export class EmptyState {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() icon = 'inbox';
}
