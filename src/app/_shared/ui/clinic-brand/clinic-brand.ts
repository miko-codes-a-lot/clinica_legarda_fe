import { Component, Input } from '@angular/core';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-clinic-brand',
  imports: [Icon],
  template: `
    <span class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
        <app-icon class="!size-6" name="tooth" />
      </span>
      <span class="flex flex-col leading-tight">
        <span class="text-base font-semibold tracking-tight">Clinica Legarda</span>
        @if (subtitle) { <span class="mt-1 text-[10px] font-medium uppercase tracking-[.16em] opacity-65">{{ subtitle }}</span> }
      </span>
    </span>
  `,
})
export class ClinicBrand {
  @Input() subtitle = 'Dental care';
}
