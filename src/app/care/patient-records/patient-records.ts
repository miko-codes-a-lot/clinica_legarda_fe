import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, Subject, switchMap } from 'rxjs';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { EmptyState } from '../../_shared/ui/empty-state/empty-state';
import { ClinicService } from '../../_shared/service/clinic-service';
import { AuthService } from '../../_shared/service/auth-service';
import { assignedClinicIds } from '../../_shared/model/user';
import { CareApiService, careError } from '../care-api.service';
import { CareClinic, PatientSearchQuery, PatientSearchResult } from '../care.models';

@Component({
  selector: 'app-patient-records',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeader, EmptyState],
  templateUrl: './patient-records.html',
})
export class PatientRecords implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(CareApiService);
  private readonly clinicService = inject(ClinicService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly requests = new Subject<PatientSearchQuery>();
  readonly base = `/${this.router.url.split('/')[1]}/care`;
  readonly form = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    clinic: new FormControl('', { nonNullable: true }),
  });
  clinics: CareClinic[] = [];
  result: PatientSearchResult = { items: [], total: 0, page: 1, pageSize: 20 };
  loading = false;
  error = '';
  clinicError = '';

  ngOnInit(): void {
    this.clinicService.getAccessible().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: clinics => {
        const user = this.auth.currentUserValue;
        const assigned = user ? assignedClinicIds(user) : [];
        this.clinics = clinics.filter(clinic => clinic._id && (user?.role !== 'dentist' || assigned.includes(clinic._id)))
          .map(clinic => ({ _id: clinic._id ?? '', name: clinic.name }));
      },
      error: error => this.clinicError = careError(error),
    });
    this.requests.pipe(switchMap(query => {
      this.loading = true;
      this.error = '';
      return this.api.searchPatients(query).pipe(
        catchError(error => { this.error = careError(error); return of({ items: [], total: 0, page: query.page ?? 1, pageSize: 20 }); }),
        finalize(() => this.loading = false),
      );
    }), takeUntilDestroyed(this.destroyRef)).subscribe(result => this.result = result);
    this.search();
  }

  search(page = 1): void { this.requests.next({ ...this.form.getRawValue(), page }); }
  get lastPage(): number { return Math.max(1, Math.ceil(this.result.total / this.result.pageSize)); }
}
