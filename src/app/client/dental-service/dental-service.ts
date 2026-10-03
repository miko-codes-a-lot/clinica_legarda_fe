import { CLINIC_PROFILE } from '../../_shared/clinic-profile';
import { Icon } from '../../_shared/ui/icon/icon';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { catchError, distinctUntilChanged, EMPTY, map, of, startWith, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { EmptyState } from '../../_shared/ui/empty-state/empty-state';
import { DentalService as DentalServiceRecord } from '../../_shared/model/dental-service';
import { AuthService } from '../../_shared/service/auth-service';
import { DentalServicesService } from '../../_shared/service/dental-services-service';

@Component({
  selector: 'app-dental-service',
  imports: [Icon, PageHeader, EmptyState, CommonModule, RouterModule],
  templateUrl: './dental-service.html',
  styleUrl: './dental-service.css',
})
export class DentalService implements OnInit {
  readonly clinic = CLINIC_PROFILE;
  services: DentalServiceRecord[] = [];
  isLoading = false;
  isSignedIn = false;
  loadError = '';
  private readonly refreshRequests = new Subject<void>();
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(DentalServicesService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.auth.currentUser$.pipe(
      map(user => user?._id || ''),
      distinctUntilChanged(),
      switchMap(userId => {
        this.isSignedIn = !!userId;
        this.services = [];
        this.loadError = '';
        this.isLoading = !!userId;
        if (!userId) return of([]);
        return this.refreshRequests.pipe(startWith(undefined), switchMap(() => {
          this.isLoading = true;
          this.loadError = '';
          return this.catalog.getAll().pipe(catchError(() => {
            this.loadError = 'We could not load the services. Please try again.';
            this.isLoading = false;
            return EMPTY;
          }));
        }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(services => {
      this.services = services;
      this.isLoading = false;
    });
  }

  loadServices(): void {
    if (this.isSignedIn && !this.isLoading) this.refreshRequests.next();
  }
}
