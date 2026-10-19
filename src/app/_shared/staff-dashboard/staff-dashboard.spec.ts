import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, switchMap, startWith, throwError } from 'rxjs';
import { StaffDashboard } from './staff-dashboard';
import { AnalyticsService } from '../service/analytics-service';
import { ClinicService } from '../service/clinic-service';
import { NotificationService } from '../service/notification-service';
import { AnalyticsReportState, ReportSelection } from '../model/analytics-report';
import { analyticsFixture } from '../model/analytics-report.fixtures';

describe('Dashboard report selection and operational widgets', () => {
  const states = new Subject<AnalyticsReportState>();
  let selections: ReportSelection[], getQueue: jasmine.Spy;
  beforeEach(() => {
    selections = []; getQueue = jasmine.createSpy('getQueue').and.returnValue(of([{ appointmentId: 'private-id', time: '09:00', patientName: 'PRIVATE_QUEUE_PATIENT', service: 'Cleaning', clinicId: 'clinic', clinicName: 'Clinic' }]));
    TestBed.configureTestingModule({ providers: [provideRouter([]),
      { provide: ClinicService, useValue: { getAccessible: () => of([{ _id: 'clinic', name: 'Clinic' }]) } },
      { provide: NotificationService, useValue: { notifications$: of([{ _id: 'notice', type: 'APPOINTMENT_STATUS_UPDATED', message: 'PRIVATE_NOTIFICATION', createdAt: '2026-10-20T00:00:00Z', read: false }]), getAllNotifications: () => of([]) } },
      { provide: AnalyticsService, useValue: { getQueue, watchReports: (choices: Subject<ReportSelection>) => choices.pipe(switchMap(selection => {
        selections.push(selection); return states.pipe(startWith<AnalyticsReportState>({ status: 'loading', clinicId: selection.clinicId }));
      })) } },
    ] });
  });
  function ready(fixture: ReturnType<typeof TestBed.createComponent<StaffDashboard>>) {
    const selection = selections.at(-1)!;
    const report = { ...analyticsFixture(selection.query), clinicId: selection.clinicId, totalAppointments: 12 };
    states.next({ status: 'ready', clinicId: selection.clinicId, report }); fixture.detectChanges(); return report;
  }
  it('clears old report values on period changes while retaining the live queue and notifications', () => {
    const fixture = TestBed.createComponent(StaffDashboard); fixture.detectChanges(); ready(fixture);
    expect(fixture.componentInstance.canExport).toBeTrue();
    fixture.componentInstance.onPeriodChange('month'); fixture.detectChanges();
    expect(fixture.componentInstance.report).toBeUndefined(); expect(fixture.componentInstance.canExport).toBeFalse();
    expect(getQueue).toHaveBeenCalledTimes(1); ready(fixture);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PRIVATE_QUEUE_PATIENT'); expect(text).toContain('PRIVATE_NOTIFICATION');
    expect(text).toContain('Month overview'); expect(fixture.componentInstance.canExport).toBeTrue(); fixture.destroy();
  });
  it('prints the displayed snapshot while omitting private queue and notification content', () => {
    const fixture = TestBed.createComponent(StaffDashboard); fixture.detectChanges(); const snapshot = ready(fixture);
    const printed = document.implementation.createHTMLDocument();
    spyOn(window, 'open').and.returnValue({ document: printed, opener: null, focus: () => {}, print: () => {} } as unknown as Window);
    fixture.componentInstance.printTables();
    expect(printed.body.textContent).toContain('Total Appointments12');
    expect(printed.body.textContent).not.toMatch(/PRIVATE_QUEUE|PRIVATE_NOTIFICATION|Queue|Notifications/);
    expect(fixture.componentInstance.appointmentTrendChart.data.labels).toEqual(snapshot.period.labels); fixture.destroy();
  });
  it('allows analytics exports when the independent queue fails', () => {
    getQueue.and.returnValue(throwError(() => new Error('Queue offline')));
    const fixture = TestBed.createComponent(StaffDashboard); fixture.detectChanges(); ready(fixture);
    expect(fixture.componentInstance.queueError).not.toBe(''); expect(fixture.componentInstance.canExport).toBeTrue(); fixture.destroy();
  });
});
