import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="ui-empty">
      <span class="material-icons mb-3 text-3xl text-accent" aria-hidden="true">{{ icon }}</span>
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
