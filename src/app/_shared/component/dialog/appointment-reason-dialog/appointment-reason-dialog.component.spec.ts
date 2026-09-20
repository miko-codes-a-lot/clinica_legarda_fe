import { MatDialogRef } from '@angular/material/dialog';
import { AppointmentReasonDialogComponent } from './appointment-reason-dialog.component';

describe('Appointment reason dialog', () => {
  for (const action of ['cancel', 'reject'] as const) {
  it('requires meaningful input before closing and returns a trimmed reason', () => {
    const close = jasmine.createSpy('close');
    const component = new AppointmentReasonDialogComponent({ close } as unknown as MatDialogRef<AppointmentReasonDialogComponent, string>, { action });
    component.reason.setValue('   ');
    component.confirm();
    expect(close).not.toHaveBeenCalled();
    component.reason.setValue('x'.repeat(501));
    component.confirm();
    expect(close).not.toHaveBeenCalled();
    component.reason.setValue('  Work conflict  ');
    component.confirm();
    expect(close).toHaveBeenCalledWith('Work conflict');
  });
  }
});
