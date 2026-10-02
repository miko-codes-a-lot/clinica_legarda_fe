import { ElementRef } from '@angular/core';
import { ThemeService } from '../_shared/service/theme-service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { AnalyticsReport, AnalyticsReportState } from '../_shared/model/analytics-report';
import { Clinic } from '../_shared/model/clinic';
import { UserSimple } from '../_shared/model/user-simple';
import { AlertService } from '../_shared/service/alert.service';
import { AnalyticsService } from '../_shared/service/analytics-service';
import { AppointmentService } from '../_shared/service/appointment-service';
import { AuthService } from '../_shared/service/auth-service';
import { ClinicService } from '../_shared/service/clinic-service';
import { DayService } from '../_shared/service/day-service';
import { DentalServicesService } from '../_shared/service/dental-services-service';
import { NotificationService } from '../_shared/service/notification-service';
import { ReasonService } from '../_shared/service/reason-service';
import { UserService } from '../_shared/service/user-service';
import { StaffAppointmentList } from '../_shared/staff-appointment-list/staff-appointment-list';
import { StaffDashboard } from '../_shared/staff-dashboard/staff-dashboard';
import { dentistAppointment, dentistUser } from '../dentist/appointment/appointment-test-fixtures';
import { AppointmentCreate } from './appointment/appointment-create/appointment-create';
import { AppointmentUpdate } from './appointment/appointment-update/appointment-update';
import { ClinicList } from './clinic/clinic-list/clinic-list';
import { UserCreate } from './user/user-create/user-create';
import { UserUpdate } from './user/user-update/user-update';

const appointment = dentistAppointment();
const clinic = appointment.clinic;
const report: AnalyticsReport = {
  clinicId: 'all',
  summary: {
    weekOf: '2026-09-07', weekEnd: '2026-09-13', today: '2026-09-10',
    totalAppointments: 0, appointmentsUpdated: 0, preferredServices: {}, declinedReferrals: {},
  },
  trend: {
    weekOf: '2026-09-07', weekEnd: '2026-09-13', labels: [],
    appointments: [], completed: [], serviceTrend: {},
  },
  queue: [],
};

describe('Admin clinic access contract', () => {
  let http: HttpTestingController;
  let totalAppointments: number;

  beforeEach(() => {
    totalAppointments = 0;
    const users = new BehaviorSubject<UserSimple | null>({ ...dentistUser, role: 'admin' });
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), ClinicService,
      ClinicList, UserCreate, UserUpdate, AppointmentCreate, AppointmentUpdate, StaffDashboard, StaffAppointmentList,
      { provide: AuthService, useValue: { currentUser$: users.asObservable(), currentUserValue: users.value } },
      { provide: Router, useValue: { url: '/admin/clinic', navigate: () => Promise.resolve(true) } },
      { provide: ActivatedRoute, useValue: { snapshot: { params: { id: appointment._id } } } },
      { provide: AlertService, useValue: { error: () => undefined } },
      { provide: DayService, useValue: { getAll: () => of([{ code: 'mon', label: 'Monday' }]) } },
      { provide: DentalServicesService, useValue: { getAll: () => of(appointment.services) } },
      { provide: AppointmentService, useValue: {
        getAll: () => of([appointment]), getOne: () => of(appointment), getEmptyNonNullDoc: () => appointment,
      } },
      { provide: UserService, useValue: {
        getPatients: () => of([appointment.patient]), getOne: () => of(appointment.patient),
      } },
      { provide: ReasonService, useValue: { getAll: () => of([]) } },
      { provide: NotificationService, useValue: {
        notifications$: of([]), getAllNotifications: () => of([]),
      } },
      { provide: AnalyticsService, useValue: {
        watchReports: (clinics: Observable<string>) => clinics.pipe(map((clinicId): AnalyticsReportState => ({
          status: 'ready', clinicId, report: { ...report, clinicId, summary: { ...report.summary, totalAppointments } },
        }))),
      } },
    ] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function respondWithClinics(clinics: Clinic[] = [clinic]): void {
    const request = http.expectOne(request => request.url.startsWith('/clinics'));
    expect(request.request.url).toBe('/clinics/accessible');
    expect(request.request.withCredentials).toBeTrue();
    request.flush(clinics);
  }

  // These cases catch accidentally repopulating staff choices from the public directory.
  for (const consumer of [
    { name: 'clinic list', create: () => TestBed.inject(ClinicList) },
    { name: 'user creation', create: () => TestBed.inject(UserCreate) },
    { name: 'user editing', create: () => TestBed.inject(UserUpdate) },
    { name: 'appointment creation', create: () => TestBed.inject(AppointmentCreate) },
    { name: 'appointment editing', create: () => TestBed.inject(AppointmentUpdate) },
  ]) {
    it(`loads authenticated clinic choices for ${consumer.name}`, () => {
      const view = TestBed.runInInjectionContext(() => consumer.create());
      view.ngOnInit();
      respondWithClinics();
      const choices = view instanceof ClinicList ? view.dataSource.data : view.clinics;
      expect(choices.map(choice => choice._id)).toEqual(['clinic-1']);
      expect(view.isLoading).toBeFalse();
    });
  }

  function dashboard(area: 'admin' | 'super-admin' = 'admin'): StaffDashboard {
    const view = TestBed.runInInjectionContext(() => TestBed.inject(StaffDashboard));
    view.area = area;
    view.ngOnInit();
    return view;
  }

  it('resets a removed report clinic selection after the current accessible clinics change', () => {
    const view = dashboard();
    respondWithClinics();
    view.onClinicChange('clinic-1');
    expect(view.canExport).toBeTrue();

    view.loadClinics();
    respondWithClinics([{ ...clinic, _id: 'clinic-2', name: 'Second clinic' }]);
    expect(view.selectedClinic).toBe('all');
    expect(view.state.clinicId).toBe('all');
    expect(view.clinics.map(choice => choice._id)).toEqual(['all', 'clinic-2']);
  });

  it('clears failed clinic choices and prevents exporting a stale report', () => {
    const view = dashboard();
    respondWithClinics();
    view.onClinicChange('clinic-1');
    view.loadClinics();
    const request = http.expectOne(request => request.url.startsWith('/clinics'));
    request.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(view.clinics).toEqual([]);
    expect(view.clinicError).not.toBe('');
    expect(view.canExport).toBeFalse();
    expect(view.report).toBeUndefined();
  });

  it('does not offer a report export to an admin with no current clinic assignments', () => {
    const view = dashboard();
    respondWithClinics([]);
    expect(view.clinics.map(choice => choice._id)).toEqual(['all']);
    expect(view.canExport).toBeFalse();
    expect(view.report).toBeUndefined();
  });

  it('refreshes an all-assigned report after rechecking current clinic access', () => {
    const view = dashboard();
    respondWithClinics();
    expect(view.report?.summary.totalAppointments).toBe(0);
    totalAppointments = 4;
    view.loadClinics();
    respondWithClinics([{ ...clinic, _id: 'clinic-2' }]);

    expect(view.selectedClinic).toBe('all');
    expect(view.report?.summary.totalAppointments).toBe(4);
  });

  it('retains global reporting for a super admin through the authenticated clinic directory', () => {
    const view = dashboard('super-admin');
    respondWithClinics([clinic, { ...clinic, _id: 'clinic-2' }]);
    expect(view.clinics.map(choice => choice._id)).toEqual(['all', 'clinic-1', 'clinic-2']);
    expect(view.canExport).toBeTrue();
  });

  it('preserves a hidden chart service when the display theme changes', () => {
    const view = dashboard('super-admin');
    respondWithClinics();
    view.state = { status: 'ready', clinicId: 'all', report: {
      ...report, trend: { ...report.trend, labels: ['Monday'], serviceTrend: { Cleaning: [1] } },
    } };
    const canvas = () => new ElementRef(document.createElement('canvas'));
    view.servicesChartRef = canvas();
    view.appointmentTrendRef = canvas();
    view.serviceTrendChartRef = canvas();
    view.declinedReferralChartRef = canvas();
    view.ngAfterViewInit();
    try {
      expect(view.serviceTrendChart.isDatasetVisible(0)).toBeTrue();
      view.serviceTrendChart.hide(0);
      expect(view.serviceTrendChart.isDatasetVisible(0)).toBeFalse();
      TestBed.inject(ThemeService).toggle();
      expect(view.serviceTrendChart.isDatasetVisible(0)).toBeFalse();
      TestBed.inject(ThemeService).toggle();
      expect(view.serviceTrendChart.isDatasetVisible(0)).toBeFalse();
    } finally {
      view.ngOnDestroy();
      localStorage.removeItem('clinica-theme');
    }
  });

  it('refreshes appointment clinic choices and removes a revoked selection', () => {
    const view = TestBed.runInInjectionContext(() => TestBed.inject(StaffAppointmentList));
    view.ngOnInit();
    respondWithClinics();
    view.selectClinic('clinic-1');
    view.refresh();
    respondWithClinics([]);

    expect(view.clinics).toEqual([]);
    expect(view.selectedClinic).toBe('all');
    expect(view.dataSource.data).toEqual([]);
    expect(view.isLoading).toBeFalse();
  });

  it('clears previously loaded appointments when refreshing clinic access fails', () => {
    const view = TestBed.runInInjectionContext(() => TestBed.inject(StaffAppointmentList));
    view.ngOnInit();
    respondWithClinics();
    expect(view.dataSource.data).toEqual([appointment]);
    view.refresh();
    http.expectOne(request => request.url.startsWith('/clinics'))
      .flush({}, { status: 403, statusText: 'Forbidden' });

    expect(view.clinics).toEqual([]);
    expect(view.dataSource.data).toEqual([]);
    expect(view.loadError).not.toBe('');
    expect(view.isLoading).toBeFalse();
  });

  for (const consumer of [
    { name: 'creation', create: () => TestBed.inject(UserCreate) },
    { name: 'editing', create: () => TestBed.inject(UserUpdate) },
  ]) {
    it(`ends user ${consumer.name} loading when clinic access is rejected`, () => {
      const view = TestBed.runInInjectionContext(() => consumer.create());
      view.ngOnInit();
      http.expectOne(request => request.url.startsWith('/clinics'))
        .flush({}, { status: 403, statusText: 'Forbidden' });
      expect(view.isLoading).toBeFalse();
      expect(view.clinics).toEqual([]);
    });
  }

  it('preserves the public clinic discovery contract for patient booking and contact pages', () => {
    let clinics: Clinic[] = [];
    TestBed.inject(ClinicService).getAll().subscribe(response => clinics = response);
    const request = http.expectOne('/clinics');
    request.flush([clinic, { ...clinic, _id: 'clinic-2' }]);
    expect(clinics.map(choice => choice._id)).toEqual(['clinic-1', 'clinic-2']);
  });
});
