import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { ClinicClosures } from './closures';
import { ClosuresApiService } from './closures-api.service';
import { ClinicService } from '../../_shared/service/clinic-service';
import { GenericTableComponent } from '../../_shared/component/table/generic-table.component';

const impact = () => ({
  impactToken: 'a'.repeat(64), generatedAt: '2026-10-22T04:00:00Z', total: 1,
  appointments: [{ _id: 'a1', patient: { _id: 'p1', firstName: 'Alex', lastName: 'Rivera' }, dentist: { _id: 'd1', firstName: 'Ana', lastName: 'Cruz' },
    clinic: { _id: 'c1', name: 'Test branch' }, date: '2026-11-02', startTime: '10:00', endTime: '10:30', status: 'confirmed', services: [{ _id: 's1', name: 'Cleaning' }], closureEffect: 'needs_rescheduling', proposalDeadline: '2026-10-29T04:00:00Z' }],
  summary: { total: 1, newlyNeedsRescheduling: 1, alreadyNeedsRescheduling: 0, protectedCare: 0, immediateCancellations: 0, cancellationRisk: 1,
    distinctPatients: 1, distinctDentists: 1, distinctServices: 1, services: [{ id: 's1', name: 'Cleaning', appointments: 1 }], byStatus: { confirmed: 1 }, byDay: { '2026-11-02': 1 },
    scheduledMinutes: 30, firstSchedule: '2026-11-02 10:00', lastSchedule: '2026-11-02 10:00', urgentAppointments: 0, proposalsWithdrawn: 0, alreadyDisrupted: 0, missingReferenceAppointments: 0,
    missingEmailPatients: 1, missingSmsPatients: 1, manualContactPatients: 1 },
});
describe('Closure impact review', () => {
  let fixture: ComponentFixture<ClinicClosures>;
  let api: { list: jasmine.Spy; preview: jasmine.Spy; create: jasmine.Spy };
  beforeEach(async () => {
    api = { list: jasmine.createSpy().and.returnValue(of([])), preview: jasmine.createSpy().and.callFake(() => of(impact())), create: jasmine.createSpy().and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { code: 'CLOSURE_PREVIEW_STALE', message: 'Refresh the closure preview.' } }))) };
    await TestBed.configureTestingModule({ imports: [ClinicClosures], providers: [provideRouter([]),
      { provide: ClosuresApiService, useValue: api }, { provide: ClinicService, useValue: { getAccessible: () => of([{ _id: 'c1', name: 'Test branch' }]) } },
    ] }).compileComponents();
    fixture = TestBed.createComponent(ClinicClosures); fixture.detectChanges();
    fixture.componentInstance.form.patchValue({ reason: 'Equipment repairs', startDate: '2026-11-02', endDate: '2026-11-02' });
  });
  it('shows the full impact aggregates and contact warning above the existing read-only table', () => {
    fixture.componentInstance.preview(); fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Immediate cancellations'); expect(text).toContain('Cancellation risk');
    expect(text).toContain('manual contact'); expect(text).toContain('Cleaning');
    const table = fixture.debugElement.query(By.directive(GenericTableComponent));
    expect(table).toBeTruthy();
    expect(table.componentInstance.rows.length).toBe(1);
    expect(api.create).not.toHaveBeenCalled();
    expect(text).toContain('Closure reason (shown to patients)');
    const days = Array.from(fixture.nativeElement.querySelectorAll('h3') as NodeListOf<HTMLElement>).find(item => item.textContent === 'Appointments by day');
    expect(days?.parentElement?.textContent).toContain('Nov 2, 2026');
  });
  it('filters the shared table by dentist, service, status and date without changing the impact totals', () => {
    fixture.componentInstance.preview(); fixture.detectChanges();
    const component = fixture.debugElement.query(By.directive(GenericTableComponent)).componentInstance as GenericTableComponent<unknown>;
    component.setFilter('dentist', 'd1'); component.setFilter('service', 's1'); component.setFilter('status', 'confirmed'); component.setDate('from', '2026-11-02'); component.setDate('to', '2026-11-02');
    expect(component.count).toBe(1);
    component.setFilter('dentist', 'different');
    expect(component.count).toBe(0);
    expect(fixture.componentInstance.previewRows.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Distinct patients');
  });
  it('submits the reviewed token, then removes stale confirmation until another preview', () => {
    fixture.componentInstance.preview(); fixture.detectChanges(); fixture.componentInstance.create(); fixture.detectChanges();
    expect(api.create).toHaveBeenCalledWith(jasmine.objectContaining({ impactToken: 'a'.repeat(64) }));
    expect(fixture.componentInstance.previewed).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Refresh the closure preview');
  });
  it('invalidates impact on form edits and handles an empty interval without hiding the review', () => {
    const empty = { ...impact(), appointments: [], total: 0, summary: { ...impact().summary, total: 0, cancellationRisk: 0, newlyNeedsRescheduling: 0, services: [] } };
    api.preview.and.returnValue(of(empty)); fixture.componentInstance.preview(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No affected appointments');
    fixture.componentInstance.form.controls.reason.setValue('Different reason'); fixture.detectChanges();
    expect(fixture.componentInstance.previewed).toBeFalse();
  });
});
