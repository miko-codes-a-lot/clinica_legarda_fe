import { Component, Input } from '@angular/core';
import { CLINIC_PROFILE } from '../../clinic-profile';

@Component({
  selector: 'app-clinic-brand',
  template: `
    <span class="flex items-center gap-3">
      <img [src]="clinic.logo" alt="" width="44" height="44" class="size-11 shrink-0 object-contain" />
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
