import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-clinic-brand',
  template: `
    <span class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
        <svg class="size-6" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3c-2.3 0-4 1.8-4 4.3 0 2 1.1 3.5 1.6 5.3.7 2.4.8 7.4 2.8 7.4 1.4 0 1.2-5.8 3.6-5.8s2.2 5.8 3.6 5.8c2 0 2.1-5 2.8-7.4.5-1.8 1.6-3.3 1.6-5.3C20 4.8 18.3 3 16 3c-1.7 0-2.6.8-4 .8S9.7 3 8 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m9 7 1 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
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
