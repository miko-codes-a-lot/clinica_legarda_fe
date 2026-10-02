import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, finalize, switchMap } from 'rxjs';
import { CareApiService, careError } from '../care-api.service';
import { PatientRecord } from '../care.models';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { EmptyState } from '../../_shared/ui/empty-state/empty-state';

@Component({ selector: 'app-patient-record', imports: [CommonModule, RouterLink, PageHeader, EmptyState], templateUrl: './patient-record.html' })
export class PatientRecordPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(CareApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly roleBase = `/${this.router.url.split('/')[1]}`;
  record: PatientRecord | null = null;
  loading = false;
  error = '';

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap]).pipe(switchMap(([params, query]) => {
      this.loading = true;
      this.error = '';
      return this.api.patientRecord(params.get('id') ?? '', query.get('clinic') ?? undefined).pipe(finalize(() => this.loading = false));
    }), takeUntilDestroyed(this.destroyRef)).subscribe({ next: record => this.record = record, error: error => this.error = careError(error) });
  }
}
