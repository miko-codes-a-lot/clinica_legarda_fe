import { Component, Input } from '@angular/core';
import { CLINIC_PROFILE } from '../../clinic-profile';

@Component({
  selector: 'app-clinic-brand',
  template: `
    <span class="flex items-center gap-3">
      <span class="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white p-0.5">
        <img [src]="clinic.logo" alt="" width="44" height="44" class="h-full w-full rounded-full object-contain" />
      </span>
      <span class="flex flex-col leading-tight">
        <span class="text-base font-semibold tracking-tight">{{ clinic.shortName }}</span>
        @if (subtitle) { <span class="mt-1 text-[10px] font-medium uppercase tracking-[.16em] opacity-65">{{ subtitle }}</span> }
      </span>
    </span>
  `,
})
export class ClinicBrand {
  readonly clinic = CLINIC_PROFILE;
  @Input() subtitle = 'Dental care';
}
