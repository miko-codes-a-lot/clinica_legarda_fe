import { Component, Input } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    styleUrl: './nav.component.css',
    imports: [RouterLink, MatSidenavModule, MatListModule, MatToolbarModule, MatIconModule, RouterModule, CommonModule],
    standalone: true
})

export class NavComponent {
  @Input() disabled = false
  @Input() menuItems: {
    label: string
    icon: string
    link?: string
    onClick?: () => void
  }[] = [];
}
