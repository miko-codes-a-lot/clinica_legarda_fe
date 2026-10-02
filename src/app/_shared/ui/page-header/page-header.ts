import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        @if (eyebrow) { <p class="ui-eyebrow mb-2">{{ eyebrow }}</p> }
        <h1 class="ui-title">{{ title }}</h1>
        @if (description) { <p class="ui-muted mt-2 max-w-2xl">{{ description }}</p> }
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2"><ng-content /></div>
    </header>
  `,
})
export class PageHeader {
  @Input({ required: true }) title = '';
  @Input() eyebrow = '';
  @Input() description = '';
}
