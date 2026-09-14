import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AlertService } from '../../../service/alert.service';
import { RescheduleDialogComponent } from './reschedule-dialog.component';

describe('Reschedule dialog', () => {
  let component: RescheduleDialogComponent;
  let close: jasmine.Spy;
  beforeEach(() => {
    close = jasmine.createSpy('close');
    component = new RescheduleDialogComponent(new FormBuilder(),
      { close } as unknown as MatDialogRef<RescheduleDialogComponent>,
      { error: jasmine.createSpy('error') } as unknown as AlertService,
      { date: '2026-09-15', startTime: '09:00', endTime: '10:00', operatingHours: [] });
    component.ngOnInit();
  });
  afterEach(() => component.ngOnDestroy());
  it('keeps the dialog open for an empty form without throwing', () => {
    expect(() => component.onSave()).not.toThrow();
    expect(close).not.toHaveBeenCalled();
  });
  it('requires a non-blank reason even after date and time are selected', () => {
    component.form.patchValue({ date: new Date(2026, 8, 16), time: '11:00', reason: '   ' });
    component.onSave();
    expect(close).not.toHaveBeenCalled();
  });
  it('clears the old time when a different date is selected', () => {
    component.form.patchValue({ date: new Date(2026, 8, 16), time: '11:00', reason: 'Work conflict' });
    component.form.controls.date.setValue(new Date(2026, 8, 17));
    expect(component.form.controls.time.value).toBe('');
    expect(component.form.invalid).toBeTrue();
  });
  it('returns the reason together with the selected date and times', () => {
    component.form.patchValue({ date: new Date(2026, 8, 16), time: '11:00', reason: '  Work conflict  ' });
    component.onSave();
    expect(close).toHaveBeenCalledWith({ date: '2026-09-16', startTime: '11:00', endTime: '12:00', reason: 'Work conflict' });
  });
});
