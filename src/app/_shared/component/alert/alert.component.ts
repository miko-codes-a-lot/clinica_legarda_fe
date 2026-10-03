import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { Icon } from '../../ui/icon/icon';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [Icon],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA)
    public data: { message: string }
  ) {}
}