import { ClinicDate } from '../../care/clinic-date';
import { AuthService } from '../../_shared/service/auth-service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { EmptyState } from '../../_shared/ui/empty-state/empty-state';
import { StatusBadge } from '../../_shared/ui/status-badge/status-badge';
import { careError } from '../../care/care-api.service';
import { ClinicCareGroup, MyCareRecord } from './my-care.models';
@Component({ selector: 'app-my-care', imports: [ClinicDate, CommonModule, RouterLink, PageHeader, EmptyState, StatusBadge],
  templateUrl: './my-care.html', styleUrl: './my-care.css', host: { '(window:afterprint)': 'resetPrintSelection()' } })
export class MyCare implements OnInit {
  private readonly destroyRef = inject(DestroyRef); private readonly http = inject(HttpClient);
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly patientName = [inject(AuthService).currentUserValue?.firstName, inject(AuthService).currentUserValue?.lastName].filter(Boolean).join(' ');
  groups: ClinicCareGroup[] = []; loading = false; error = ''; printedVisit = '';
  get printGroups(): ClinicCareGroup[] {
    if (!this.printedVisit) return this.groups;
    return this.groups.flatMap(group => {
      const visits = group.visits.filter(visit => visit._id === this.printedVisit);
      if (!visits.length) return [];
      return [{ ...group, visits, cases: group.cases.filter(careCase =>
        careCase.consultationVisit === this.printedVisit || visits.some(visit => visit.careCase === careCase._id)) }];
    });
  }
  ngOnInit() { this.load(); }
  load() {
    if (this.loading) return; this.loading = true; this.error = '';
    this.http.get<MyCareRecord>('/care/my-record').pipe(finalize(() => this.loading = false), takeUntilDestroyed(this.destroyRef)).subscribe({ next: record => {
      const clinics = new Map([...record.visits.map(v => v.clinic), ...record.cases.map(c => c.clinic)].map(c => [c._id, c]));
      this.groups = [...clinics.values()].map(clinic => ({ clinic, visits: record.visits.filter(v => v.clinic._id === clinic._id),
        cases: record.cases.filter(c => c.clinic._id === clinic._id).map(c => ({ ...c, visits: record.visits.filter(v => v.careCase === c._id), sessions: record.appointments.filter(a => a.careCase === c._id) })) }));
    }, error: error => { this.groups = []; this.error = careError(error); } });
  }
  print(id: string) {
    this.printedVisit = id;
    // The print dialog can open before Angular's coalesced change detection runs.
    this.changeDetector.detectChanges();
    window.print();
  }
  resetPrintSelection() { this.printedVisit = ''; }
}
