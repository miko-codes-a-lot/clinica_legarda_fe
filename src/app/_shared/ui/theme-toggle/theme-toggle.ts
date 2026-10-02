import { Component, inject } from '@angular/core';
import { ThemeService } from '../../service/theme-service';

@Component({
  selector: 'app-theme-toggle',
  template: `
    <button type="button" class="ui-icon-button" (click)="theme.toggle()"
      [attr.aria-label]="theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      [title]="theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
      @if (theme.theme() === 'dark') {
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      } @else {
        <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20.8 13.1A9 9 0 0 1 10.9 3.2a9 9 0 1 0 9.9 9.9Z" />
        </svg>
      }
    </button>
  `,
  styles: ':host { display: inline-flex; flex-shrink: 0; }',
})
export class ThemeToggle {
  readonly theme = inject(ThemeService);
}
