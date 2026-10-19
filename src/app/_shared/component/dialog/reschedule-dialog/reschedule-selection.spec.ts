import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCalendarHarness } from '@angular/material/datepicker/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserStatus } from '../../../model/user';
import { appConfig } from '../../../../app.config';
import { RescheduleDialogComponent, RescheduleDialogData, RescheduleDialogResult } from './reschedule-dialog.component';

@Component({ template: '' })
class DialogHost {}

describe('Rescheduling date and time selection', () => {
  const operatingHours = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    .map(day => ({ day, startTime: '09:00', endTime: '17:00' }));
  let dialog: MatDialogRef<RescheduleDialogComponent, RescheduleDialogResult>;
  let http: HttpTestingController;

  async function openDialog() {
    TestBed.configureTestingModule({
      // Importing the dialog here hoists its date adapter into TestBed's root
      // injector and hides provider-scope failures in the real lazy dialog.
      imports: [DialogHost],
      providers: [...appConfig.providers, provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(DialogHost);
    const data: RescheduleDialogData = {
      appointmentId: 'visit-1', date: '2026-09-18', startTime: '11:00', endTime: '12:30',
      clinic: { _id: 'clinic-1', name: 'Clinic', address: '', mobileNumber: '', emailAddress: '', operatingHours, dentists: [] },
      dentist: { _id: 'dentist-1', firstName: 'Test', middleName: '', lastName: 'Dentist',
        emailAddress: '', mobileNumber: '', address: '', role: 'dentist', status: UserStatus.CONFIRMED,
        clinics: ['clinic-1'], operatingHours, appointments: [] },
    };
    dialog = TestBed.inject(MatDialog).open(RescheduleDialogComponent, {
      data, enterAnimationDuration: 0, exitAnimationDuration: 0,
    });
    fixture.detectChanges();
    http = TestBed.inject(HttpTestingController);
    http.expectOne(request => request.url.endsWith('/appointments/availability/dentist-1')).flush([]);
    http.expectOne(request => request.url.endsWith('/clinic-closures/availability') && request.params.get('clinic') === 'clinic-1').flush([]);
    http.expectOne(request => request.url.endsWith('/dentist-availability/dentist-1/public')).flush([]);
    fixture.detectChanges();
    return { fixture, loader: TestbedHarnessEnvironment.documentRootLoader(fixture) };
  }

  afterEach(() => {
    dialog?.close();
    http?.verify();
  });

  it('selects a new schedule using the inline calendar and labelled time buttons', async () => {
    const { fixture, loader } = await openDialog();
    const calendar = await loader.getHarness(MatCalendarHarness);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getMonth() !== new Date().getMonth()) await calendar.next();
    await calendar.selectCell({ text: String(tomorrow.getDate()) });
    fixture.detectChanges();
    const time = Array.from(document.querySelectorAll<HTMLButtonElement>('app-booking-calendar button.slot'))
      .find(button => button.textContent?.includes('9:00 AM'));
    expect(time?.disabled).toBeFalse(); time?.click();
    expect(dialog.componentInstance.form.controls.time.value).toBe('09:00');
    dialog.componentInstance.form.controls.reason.setValue('Schedule conflict');
    const saved = firstValueFrom(dialog.afterClosed()); dialog.componentInstance.onSave();
    const day = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    expect(await saved).toEqual({ date: day, startTime: '09:00', endTime: '10:30', reason: 'Schedule conflict' });
  });

  it('shows no time buttons until an appointment day is selected', async () => {
    await openDialog();
    expect(document.querySelectorAll('app-booking-calendar button.slot').length).toBe(0);
    expect(document.querySelector('app-booking-calendar')?.textContent).toContain('Select an appointment day');
  });

  it('supports calendar month navigation without closing the dialog', async () => {
    const { loader } = await openDialog(); const calendar = await loader.getHarness(MatCalendarHarness);
    const previous = await calendar.getCurrentViewLabel();
    await calendar.next();
    expect(await calendar.getCurrentViewLabel()).not.toBe(previous);
    expect(dialog.componentInstance.form.controls.date.value).toBeNull();
    expect(document.querySelector('app-booking-calendar')).not.toBeNull();
  });
});
