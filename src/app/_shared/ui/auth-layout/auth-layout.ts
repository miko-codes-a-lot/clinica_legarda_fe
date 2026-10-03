import { CLINIC_PROFILE } from '../../clinic-profile';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClinicBrand } from '../clinic-brand/clinic-brand';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterLink, ClinicBrand, ThemeToggle],
  template: `
    <section class="ui-auth-layout max-w-5xl items-stretch gap-0 lg:gap-0">
      <aside class="flex flex-col justify-between rounded-t-3xl bg-brand-900 p-7 text-white sm:p-10 lg:rounded-l-3xl lg:rounded-tr-none">
        <a routerLink="/app/home" class="w-fit rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" [attr.aria-label]="clinic.shortName + ' home'">
          <app-clinic-brand [subtitle]="eyebrow" />
        </a>
        <div class="hidden max-w-sm lg:my-16 lg:block">
          <p class="mb-3 text-xs font-semibold uppercase tracking-[.18em] text-brand-200">Care, connected</p>
          <h2 class="text-2xl font-semibold leading-tight sm:text-3xl">Your next visit starts here.</h2>
          <p class="mt-4 text-sm leading-7 text-brand-100">Manage appointments and stay connected with your clinic through your {{ clinic.shortName }} account.</p>
        </div>
        <a routerLink="/app/privacy-policy" class="mt-6 hidden w-fit text-xs text-brand-100 underline underline-offset-4 lg:block">Privacy policy</a>
      </aside>
      <div class="ui-auth-card rounded-t-none lg:rounded-l-none lg:rounded-tr-3xl">
        @if (showThemeToggle) { <div class="mb-5 flex justify-end"><app-theme-toggle /></div> }
        <p class="ui-eyebrow mb-3">{{ eyebrow }}</p>
        <h1 class="ui-title">{{ title }}</h1>
        @if (description) { <p class="ui-muted mb-7 mt-3">{{ description }}</p> }
        <ng-content />
      </div>
    </section>
  `,
})
export class AuthLayout {
  readonly clinic = CLINIC_PROFILE;
  @Input({ required: true }) title = '';
  @Input() eyebrow = 'Patient portal';
  @Input() description = '';
  @Input() showThemeToggle = false;
}
