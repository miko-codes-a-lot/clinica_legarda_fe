import { CLINIC_PROFILE } from '../../clinic-profile';
import { Icon } from '../../ui/icon/icon';
import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ClinicBrand } from '../../ui/clinic-brand/clinic-brand';
import { ThemeToggle } from '../../ui/theme-toggle/theme-toggle';

@Component({
  selector: 'app-client-nav',
  templateUrl: './client-nav.component.html',
  styleUrl: './client-nav.component.css',
  imports: [Icon, RouterLink, RouterLinkActive, ClinicBrand, ThemeToggle],
  standalone: true
})
export class ClientNavComponent {
  readonly clinic = CLINIC_PROFILE;
  @Input() disabled = false;
  @Input() menuItems: {
    label: string;
    icon: string;
    link?: string;
    onClick?: () => void;
  }[] = [];
  mobileOpen = false;
}
