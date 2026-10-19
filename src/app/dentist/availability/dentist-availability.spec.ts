import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { DentistAvailability } from './dentist-availability';
import { DentistAvailabilityApi, DentistDayAvailability } from '../../_shared/service/dentist-availability-api';
import { AuthService } from '../../_shared/service/auth-service';
import { ClinicService } from '../../_shared/service/clinic-service';
import { AppointmentService } from '../../_shared/service/appointment-service';
import { UserSimple } from '../../_shared/model/user-simple';

describe('Dentist availability review', () => {
  const day = new Date(2026, 10, 4);
  let api: jasmine.SpyObj<DentistAvailabilityApi>;
  const user = { _id: 'dentist', role: 'dentist', clinics: ['clinic'], operatingHours: [{ day: 'wednesday', startTime: '09:00', endTime: '17:00' }] } as UserSimple;
  beforeEach(() => {
    api = jasmine.createSpyObj('AvailabilityApi', ['list', 'preview', 'save']);
    api.list.and.returnValue(of([])); api.preview.and.returnValue(of({ appointments: [], total: 0 }));
    api.save.and.returnValue(of({ date: '2026-11-04', intervals: [], revision: 1 } as DentistDayAvailability));
    TestBed.configureTestingModule({ providers: [
      { provide: DentistAvailabilityApi, useValue: api }, { provide: AuthService, useValue: { currentUser$: of(user) } },
      { provide: ClinicService, useValue: { getAccessible: () => of([{ _id: 'clinic', name: 'Clinic', operatingHours: user.operatingHours }]) } },
      { provide: AppointmentService, useValue: { getAllByDentist: () => of([]) } },
    ] });
  });
  it('selects only the dentist’s current assigned clinic even when the API returns other clinics first', () => {
    TestBed.overrideProvider(AuthService, { useValue: { currentUser$: of({ ...user, clinics: ['other'] }) } });
    TestBed.overrideProvider(ClinicService, { useValue: { getAccessible: () => of([{ _id: 'clinic', name: 'Unassigned clinic' }, { _id: 'other', name: 'Assigned clinic' }]) } });
    const fixture = TestBed.createComponent(DentistAvailability); fixture.detectChanges();
    expect(fixture.componentInstance.clinics.map(clinic => clinic._id)).toEqual(['other']);
    expect(fixture.componentInstance.clinicId).toBe('other');
    expect(api.list).toHaveBeenCalledWith('dentist', 'other', jasmine.any(String), jasmine.any(String));
    fixture.destroy();
  });
  it('keeps the no-assignment state instead of requesting an unassigned clinic', () => {
    TestBed.overrideProvider(AuthService, { useValue: { currentUser$: of({ ...user, clinics: [] }) } });
    const fixture = TestBed.createComponent(DentistAvailability); fixture.detectChanges();
    expect(fixture.componentInstance.clinics).toEqual([]); expect(fixture.componentInstance.clinicId).toBe('');
    expect(api.list).not.toHaveBeenCalled(); fixture.destroy();
  });
  it('requires review, clears it on edits and sends the reviewed affected IDs', () => {
    const fixture = TestBed.createComponent(DentistAvailability); fixture.detectChanges();
    const component = fixture.componentInstance; component.selectDate(day);
    component.save(); expect(api.save).not.toHaveBeenCalled();
    api.preview.and.returnValue(of({ appointments: [{ _id: 'affected', startTime: '12:00', endTime: '12:30' }], total: 1 }));
    component.preview(); expect(component.previewed).toBeTrue();
    component.invalidate(); component.save(); expect(api.save).not.toHaveBeenCalled();
    component.preview(); component.save();
    expect(api.save).toHaveBeenCalledWith('dentist', '2026-11-04', jasmine.objectContaining({ acknowledgedAppointmentIds: ['affected'], expectedRevision: 0 }));
    fixture.destroy();
  });
  it('keeps a stale revision failure visible and requires another review', () => {
    const fixture = TestBed.createComponent(DentistAvailability); fixture.detectChanges(); const component = fixture.componentInstance;
    component.selectDate(day); component.preview();
    api.save.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'Availability changed. Reload.' } })));
    component.save(); expect(component.error).toContain('Availability changed'); expect(component.previewed).toBeFalse();
    fixture.destroy();
  });
  it('discards an old clinic response after a newer selection', () => {
    const old = new Subject<DentistDayAvailability[]>(); api.list.and.returnValue(old);
    const fixture = TestBed.createComponent(DentistAvailability); fixture.detectChanges(); const component = fixture.componentInstance;
    api.list.and.returnValue(of([])); component.clinicId = 'other'; component.load();
    old.next([{ date: '2026-11-04', intervals: [], revision: 99 } as DentistDayAvailability]);
    expect(component.days).toEqual([]); fixture.destroy();
  });
});
