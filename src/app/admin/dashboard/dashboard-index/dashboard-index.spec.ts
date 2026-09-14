import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { Clinic } from '../../../_shared/model/clinic';
import { Notification, NotificationType } from '../../../_shared/model/notification';
import { Referral, ReferralStatus } from '../../../_shared/model/referral';
import { Reason, ReasonUsage } from '../../../_shared/model/reason';
import { User } from '../../../_shared/model/user';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { NotificationService } from '../../../_shared/service/notification-service';
import { ReasonService } from '../../../_shared/service/reason-service';
import { ReferralService } from '../../../_shared/service/referral-service';
import { DashboardIndex } from './dashboard-index';

const clinic: Clinic = {
  _id: 'clinic-a', name: 'Legarda Clinic', address: '', mobileNumber: '',
  emailAddress: '', operatingHours: [], dentists: [],
};
const otherClinic: Clinic = { ...clinic, _id: 'clinic-b', name: 'Other Clinic' };
const patient: User = {
  firstName: 'Test', middleName: '', lastName: 'Patient', emailAddress: '',
  mobileNumber: '', address: '', operatingHours: [], appointments: [], role: 'patient',
};

function appointment(id: string, selectedClinic: Clinic, status: AppointmentStatus): Appointment {
  return {
    _id: id, clinic: selectedClinic, patient, dentist: patient,
    services: [{ name: 'Cleaning <routine>', duration: 30 }],
    date: new Date(2026, 8, 7, 9), startTime: '09:00', endTime: '09:30', status,
    notes: { patientNotes: '', clinicNotes: '' }, history: [],
  };
}

describe('DashboardIndex graph printing', () => {
  let component: DashboardIndex;
  let fixture: ComponentFixture<DashboardIndex>;
  let appointments: Subject<Appointment[]>;
  let referrals: Subject<Referral[]>;
  let reasons: Subject<Reason[]>;
  let notifications: BehaviorSubject<Notification[]>;
  let printDocument: Document;
  let printWindow: Pick<Window, 'document' | 'focus' | 'print'>;

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 8, 7, 12));
    appointments = new Subject<Appointment[]>();
    referrals = new Subject<Referral[]>();
    reasons = new Subject<Reason[]>();
    notifications = new BehaviorSubject<Notification[]>([]);
    await TestBed.configureTestingModule({
      imports: [DashboardIndex],
      providers: [
        { provide: AppointmentService, useValue: { getAll: () => appointments } },
        { provide: ClinicService, useValue: { getAll: () => of([clinic, otherClinic]) } },
        { provide: ReferralService, useValue: { getAll: () => referrals } },
        { provide: ReasonService, useValue: { getAll: () => reasons } },
        { provide: NotificationService, useValue: {
          notifications$: notifications, getAllNotifications: () => of([]),
        } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardIndex);
    component = fixture.componentInstance;
    fixture.detectChanges();
    printDocument = document.implementation.createHTMLDocument('Report');
    printWindow = { document: printDocument, focus: jasmine.createSpy('focus'), print: jasmine.createSpy('print') };
    spyOn(window, 'open').and.returnValue(printWindow as Window);
  });

  afterEach(() => {
    fixture.destroy();
    jasmine.clock().uninstall();
  });

  function loadData(): void {
    appointments.next([
      appointment('a', clinic, AppointmentStatus.CONFIRMED),
      appointment('b', clinic, AppointmentStatus.PENDING),
      appointment('c', otherClinic, AppointmentStatus.CONFIRMED),
    ]);
    reasons.next([{ code: 'unavailable', label: 'Service unavailable', usage: ReasonUsage.DECLINE }]);
    referrals.next([{
      appointment: appointment('d', otherClinic, AppointmentStatus.CONFIRMED),
      fromClinicId: otherClinic, fromDoctorId: patient, status: ReferralStatus.REJECTED,
      reasonOfDecline: 'unavailable',
    }]);
    fixture.detectChanges();
  }

  function printReport(): void {
    const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(candidate => candidate.textContent?.trim() === 'Print Tables');
    expect(button).withContext('Admin dashboard should offer Print Tables').toBeDefined();
    button?.click();
  }

  function tableRows(title: string): string[][] {
    const section = Array.from(printDocument.querySelectorAll('section'))
      .find(candidate => candidate.querySelector('h2')?.textContent === title);
    return Array.from(section?.querySelectorAll('tbody tr') ?? [])
      .map(row => Array.from(row.querySelectorAll('td')).map(cell => cell.textContent ?? ''));
  }

  it('prints the selected clinic values and exact weekly dates for all four graphs', () => {
    loadData();
    component.onClinicChange('clinic-a');
    fixture.detectChanges();

    printReport();

    expect(printDocument.querySelectorAll('table').length).toBe(7);
    expect(printDocument.body.textContent).toContain('Legarda Clinic');
    expect(printDocument.body.textContent).toContain('Sep 7, 2026 - Sep 13, 2026');
    expect(tableRows('Preferred Services Distribution')).toEqual([['Cleaning <routine>', '1', '100.0%']]);
    expect(tableRows('Weekly Appointment Trend')[0]).toEqual(['Sep 7, 2026', 'Lun', '2', '1']);
    expect(tableRows('Service Trend per Day')[0]).toEqual(['Sep 7, 2026', 'Mon', 'Cleaning <routine>', '2']);
    expect(tableRows('No. of Declined Service and Reasons')).toEqual([['Service unavailable', '1', '100.0%']]);
    expect(printDocument.body.textContent).toContain('All clinics; all dates');
    expect(printDocument.querySelector('routine')).toBeNull();
    expect(printWindow.print).toHaveBeenCalled();
  });

  it('uses refreshed chart values after switching back to all clinics', () => {
    loadData();
    component.onClinicChange('clinic-a');
    component.onClinicChange('all');
    fixture.detectChanges();

    printReport();

    expect(tableRows('Preferred Services Distribution')).toEqual([['Cleaning <routine>', '2', '100.0%']]);
    expect(tableRows('Weekly Appointment Trend')[0]?.slice(2)).toEqual(['3', '2']);
  });

  it('prints empty distributions and all seven zero-valued days when no appointments exist', () => {
    appointments.next([]);
    referrals.next([]);
    fixture.detectChanges();

    printReport();

    expect(printDocument.body.textContent).toContain('No data available.');
    const rows = tableRows('Weekly Appointment Trend');
    expect(rows.length).toBe(7);
    expect(rows.every(row => row[2] === '0' && row[3] === '0')).toBeTrue();
  });

  it('explains how to continue when the print window is blocked', () => {
    loadData();
    (window.open as jasmine.Spy).and.returnValue(null);

    printReport();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent)
      .toContain('Allow pop-ups to print the graph tables, or use Export PDF.');
  });

  it('keeps reporting unavailable until the displayed graphs have loaded', () => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('.report-actions button') as NodeListOf<HTMLButtonElement>);

    expect(buttons.length).toBe(2);
    expect(buttons.every(button => button.disabled)).toBeTrue();
  });


  it('labels the dashboard with the same local Monday used by its weekly graphs', () => {
    loadData();

    expect(fixture.nativeElement.querySelector('.week-info')?.textContent).toContain('Sep 7, 2026');
  });

  it('preserves dashboard metrics, selected-clinic queue, and the latest ten notifications', () => {
    loadData();
    const updated = appointment('updated', clinic, AppointmentStatus.CONFIRMED);
    updated.updatedAt = '2026-09-07T01:00:00Z';
    appointments.next([updated, appointment('other', otherClinic, AppointmentStatus.CONFIRMED)]);
    component.onClinicChange('clinic-a');
    notifications.next(Array.from({ length: 11 }, (_, index) => ({
      _id: String(index), recipient: 'admin', message: `Notice ${index}`, read: index % 2 === 0,
      type: NotificationType.APPOINTMENT_STATUS_UPDATED,
      createdAt: new Date(2026, 8, 7, index).toISOString(), updatedAt: new Date(2026, 8, 7, index).toISOString(),
    })));
    fixture.detectChanges();

    printReport();

    expect(tableRows('Dashboard Metrics').map(row => row.slice(0, 2))).toEqual([
      ['Total Appointments', '1'], ['Records Updated', '1'], ["Today's Queue", '1'],
    ]);
    expect(tableRows("Today's Appointment Queue")).toEqual([['09:00', 'Test Patient', 'Cleaning <routine>']]);
    const notificationRows = tableRows('Recent Notifications');
    expect(notificationRows.length).toBe(10);
    expect(notificationRows[0]).toEqual(['Status Update', 'Notice 10', new Date(2026, 8, 7, 10).toLocaleString(), 'Read']);
    expect(notificationRows[9][1]).toBe('Notice 1');
    expect(notificationRows[9][3]).toBe('Unread');
  });

});
