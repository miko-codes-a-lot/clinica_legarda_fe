import { Component, inject } from '@angular/core';
import { ThemeService } from '../../service/theme-service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-theme-toggle',
  imports: [Icon],
  template: `
    <button type="button" class="ui-icon-button" (click)="theme.toggle()"
      [attr.aria-label]="theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      [title]="theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
      <app-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" />
    </button>
  `,
  styles: ':host { display: inline-flex; flex-shrink: 0; }',
})
export class ThemeToggle {
  readonly theme = inject(ThemeService);
}
