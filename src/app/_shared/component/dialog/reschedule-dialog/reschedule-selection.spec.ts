import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestKey } from '@angular/cdk/testing';
import { MatDatepickerInputHarness, MatDatepickerToggleHarness } from '@angular/material/datepicker/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserStatus } from '../../../model/user';
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
      imports: [DialogHost, RescheduleDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
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
    http.expectOne('/appointments/availability/dentist-1').flush([]);
    fixture.detectChanges();
    return TestbedHarnessEnvironment.documentRootLoader(fixture);
  }

  afterEach(() => {
    dialog?.close();
    http?.verify();
  });

  it('opens the calendar from the date field and lets the dentist select and save a new schedule', async () => {
    const loader = await openDialog();
    const dateInput = await loader.getHarness(MatDatepickerInputHarness);
    await (await dateInput.host()).click();
    expect(await dateInput.isCalendarOpen()).toBeTrue();
    const calendar = await dateInput.getCalendar();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getMonth() !== new Date().getMonth()) await calendar.next();
    await calendar.selectCell({ text: String(tomorrow.getDate()) });

    const time = await loader.getHarness(MatSelectHarness);
    await time.open();
    await time.clickOptions({ text: '9:00 AM' });
    expect(dialog.componentInstance.form.controls.time.value).toBe('09:00');
    dialog.componentInstance.form.controls.reason.setValue('Schedule conflict');
    const saved = firstValueFrom(dialog.afterClosed());
    dialog.componentInstance.onSave();

    const day = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    expect(await saved).toEqual({ date: day, startTime: '09:00', endTime: '10:30', reason: 'Schedule conflict' });
  });

  it('makes the time field unavailable until an appointment day is selected', async () => {
    const loader = await openDialog();
    const time = await loader.getHarness(MatSelectHarness);
    expect(await time.isDisabled()).toBeTrue();
  });

  it('can still open the calendar using its existing toggle', async () => {
    const loader = await openDialog();
    const toggle = await loader.getHarness(MatDatepickerToggleHarness);
    await toggle.openCalendar();
    expect(await toggle.isCalendarOpen()).toBeTrue();
  });

  it('opens the calendar with Enter while the date field has focus', async () => {
    const loader = await openDialog();
    const dateInput = await loader.getHarness(MatDatepickerInputHarness);
    await dateInput.focus();
    await (await dateInput.host()).sendKeys(TestKey.ENTER);
    expect(await dateInput.isCalendarOpen()).toBeTrue();
  });
});
