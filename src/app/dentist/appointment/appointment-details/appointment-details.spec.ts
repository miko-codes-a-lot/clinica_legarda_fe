import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { Appointment, AppointmentStatus } from '../../../_shared/model/appointment';
import { Referral, ReferralStatus } from '../../../_shared/model/referral';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { AlertService } from '../../../_shared/service/alert.service';
import { dentistAppointment } from '../appointment-test-fixtures';
import { AppointmentDetails } from './appointment-details';

describe('Dentist appointment details', () => {
  let fixture: ComponentFixture<AppointmentDetails>;
  let storedAppointment: Appointment;
  let returnReferralId: boolean;

  beforeEach(async () => {
    storedAppointment = dentistAppointment();
    returnReferralId = false;
    await TestBed.configureTestingModule({
      imports: [AppointmentDetails],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: storedAppointment._id } } } },
        { provide: AlertService, useValue: { error: () => undefined, success: () => undefined } },
        { provide: AppointmentService, useValue: {
          getOne: () => of(storedAppointment), getAll: () => of([]),
          cancelAppointment: (_id: string, reason?: string) => {
            storedAppointment = { ...storedAppointment, status: AppointmentStatus.CANCELLED,
              history: [{ action: 'Appointment cancelled', timestamp: new Date('2026-09-07T01:00:00Z'), reason }] };
            return of(returnReferralId ? { ...storedAppointment, referral: 'referral-1' as unknown as Referral } : storedAppointment);
          },
        } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppointmentDetails);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
    fixture.destroy();
  });

  it('keeps the appointment until a reason is supplied and then displays the saved cancellation reason', fakeAsync(() => {
    fixture.componentInstance.cancelAppointment();
    fixture.detectChanges();
    expect(storedAppointment.status).toBe(AppointmentStatus.CONFIRMED);
    const textarea = document.querySelector<HTMLTextAreaElement>('mat-dialog-container textarea');
    expect(textarea).not.toBeNull();
    if (!textarea) return;
    textarea.value = 'Emergency clinic closure';
    textarea.dispatchEvent(new Event('input'));
    TestBed.inject(ApplicationRef).tick();
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>('mat-dialog-container button'))
      .find(element => element.textContent?.trim() === 'Cancel appointment');
    expect(button).not.toBeUndefined();
    expect(button?.disabled).toBeFalse();
    button?.click();
    tick(500);
    fixture.detectChanges();
    expect(storedAppointment.status).toBe(AppointmentStatus.CANCELLED);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Emergency clinic closure');
  }));

  it('preserves referred clinic details when the cancellation response contains only a referral ID', fakeAsync(() => {
    storedAppointment.referral = { _id: 'referral-1', status: ReferralStatus.CONFIRMED, reasonOfDecline: '',
      fromClinicId: { ...storedAppointment.clinic, name: 'Referral origin clinic' },
      fromDoctorId: storedAppointment.dentist, appointment: dentistAppointment() };
    fixture.componentInstance.loadAppointment();
    returnReferralId = true;
    fixture.componentInstance.cancelAppointment();
    TestBed.inject(MatDialog).openDialogs[0].close('Emergency clinic closure');
    tick(500);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Referral origin clinic');
    expect(fixture.componentInstance.appointment?.status).toBe(AppointmentStatus.CANCELLED);
  }));

  it('leaves the appointment confirmed when the cancellation dialog is dismissed', () => {
    fixture.componentInstance.cancelAppointment();
    TestBed.inject(MatDialog).closeAll();
    fixture.detectChanges();
    expect(storedAppointment.status).toBe(AppointmentStatus.CONFIRMED);
  });
});
