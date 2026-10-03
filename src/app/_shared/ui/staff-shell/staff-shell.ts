import { Component, DestroyRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDrawerContent, MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { Icon } from '../icon/icon';
import { MatButtonModule } from '@angular/material/button';
import { NavComponent, NavigationItem } from '../../component/nav/nav.component';
import { ClinicBrand } from '../clinic-brand/clinic-brand';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-staff-shell',
  standalone: true,
  imports: [MatSidenavModule, MatMenuModule, Icon, MatButtonModule, NavComponent, ClinicBrand, ThemeToggle],
  templateUrl: './staff-shell.html',
  styleUrl: './staff-shell.css',
})
export class StaffShell {
  @Input() menuItems: NavigationItem[] = [];
  @Input() roleLabel = 'Workspace';
  @Input() title = 'Dashboard';
  @Input() userName = '';
  @Input() busy = false;
  @Input() accountEnabled = true;
  @Output() logout = new EventEmitter<void>();
  @Output() account = new EventEmitter<void>();
  isMobile = false;
  menuOpen = false;
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild(MatDrawerContent) private content?: MatDrawerContent;

  constructor() {
    inject(Router).events.pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.content?.scrollTo({ top: 0 }));
    inject(BreakpointObserver).observe('(max-width: 1023px)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.isMobile = state.matches;
        this.menuOpen = false;
      });
  }

  closeMobileMenu(): void {
    if (this.isMobile) this.menuOpen = false;
  }
}
