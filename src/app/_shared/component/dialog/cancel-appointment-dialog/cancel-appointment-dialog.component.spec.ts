import { MatDialogRef } from '@angular/material/dialog';
import { CancelAppointmentDialogComponent } from './cancel-appointment-dialog.component';

describe('Cancellation reason dialog', () => {
  it('requires meaningful input before closing and returns a trimmed reason', () => {
    const close = jasmine.createSpy('close');
    const component = new CancelAppointmentDialogComponent({ close } as unknown as MatDialogRef<CancelAppointmentDialogComponent, string>);
    component.reason.setValue('   ');
    component.confirm();
    expect(close).not.toHaveBeenCalled();
    component.reason.setValue('  Work conflict  ');
    component.confirm();
    expect(close).toHaveBeenCalledWith('Work conflict');
  });
});
