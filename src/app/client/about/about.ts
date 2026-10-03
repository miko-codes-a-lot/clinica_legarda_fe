import { CLINIC_PROFILE } from '../../_shared/clinic-profile';
import { Icon } from '../../_shared/ui/icon/icon';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  imports: [Icon, PageHeader, RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About {
  readonly clinic = CLINIC_PROFILE;

}
