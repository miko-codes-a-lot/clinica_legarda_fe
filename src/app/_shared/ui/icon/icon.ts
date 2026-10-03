import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ICON_ALIASES, ICON_PATHS } from './icon-paths';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex size-5 shrink-0 align-middle', 'aria-hidden': 'true' },
  template: `
    <svg class="size-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      @for (path of paths; track $index) { <path [attr.d]="path" /> }
    </svg>
  `,
})
export class Icon {
  @Input({ required: true }) name = '';

  get paths(): readonly string[] {
    return ICON_PATHS[ICON_ALIASES[this.name] ?? this.name] ?? ICON_PATHS['question-mark-circle'];
  }
}
