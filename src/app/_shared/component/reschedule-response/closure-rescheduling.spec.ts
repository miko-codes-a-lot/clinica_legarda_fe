import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { RescheduleResponse } from './reschedule-response';
import { Appointment, AppointmentStatus } from '../../model/appointment';
import { AppointmentService } from '../../service/appointment-service';
import { AlertService } from '../../service/alert.service';
import { dentistAppointment } from '../../../dentist/appointment/appointment-test-fixtures';

const proposalId = '10000000-0000-4000-8000-000000000001';
describe('Closure rescheduling actions', () => {
  let fixture: ComponentFixture<RescheduleResponse>, appointment: Appointment;
  let api: { respondToReschedule: jasmine.Spy; rescheduleAppointment: jasmine.Spy; cancelAppointment: jasmine.Spy; getOne: jasmine.Spy };
  let dialog: jasmine.Spy;
  const buttons = () => Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
  const button = (text: string) => buttons().find(item => item.textContent?.includes(text));
  beforeEach(async () => {
    appointment = dentistAppointment({ status: AppointmentStatus.PENDING, date: new Date('2030-11-04') });
    Object.assign(appointment, { closureRescheduling: { originalStatus: 'confirmed', originalSchedule: { date: '2030-11-02', startTime: '10:00', endTime: '10:30' }, enteredAt: '2030-10-22T04:00:00Z', reasons: ['Equipment repairs'] },
      rescheduleProposal: { id: proposalId, origin: 'clinic_closure', proposedBySide: 'patient', reason: 'Replacement', proposedAt: '2030-10-22', previousSchedule: { date: '2030-11-02', startTime: '10:00', endTime: '10:30' } } });
    api = { respondToReschedule: jasmine.createSpy().and.returnValue(of(appointment)), rescheduleAppointment: jasmine.createSpy().and.returnValue(of(appointment)), cancelAppointment: jasmine.createSpy().and.returnValue(of(appointment)), getOne: jasmine.createSpy().and.returnValue(of(appointment)) };
    dialog = jasmine.createSpy().and.returnValue({ afterClosed: () => of(true) });
    await TestBed.configureTestingModule({ imports: [RescheduleResponse], providers: [
      { provide: AppointmentService, useValue: api }, { provide: MatDialog, useValue: { open: dialog } },
      { provide: AlertService, useValue: { success: jasmine.createSpy(), error: jasmine.createSpy() } },
    ] }).compileComponents();
    fixture = TestBed.createComponent(RescheduleResponse); fixture.componentInstance.appointment = appointment;
  });
  it('shows patient requests as awaiting clinic review without patient self-approval', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Awaiting clinic review');
    expect(fixture.nativeElement.textContent).toContain('The clinic must respond before the proposed start time');
    expect(fixture.nativeElement.textContent).not.toContain('Please respond before');
    expect(button('Accept new time')).toBeUndefined();
    expect(button('Decline')).toBeUndefined();
    fixture.componentInstance.accept(); expect(api.respondToReschedule).not.toHaveBeenCalled();
  });
  it('lets clinic staff accept or decline the patient proposal through clinic review', () => {
    fixture.componentInstance.mode = 'staff'; fixture.detectChanges();
    expect(button('Approve replacement')).toBeDefined(); expect(button('Decline')).toBeDefined();
    expect(fixture.nativeElement.textContent).not.toContain('Agreement note');
    button('Approve replacement')?.click();
    expect(api.respondToReschedule).toHaveBeenCalledWith(appointment._id, jasmine.objectContaining({ proposalId, method: 'clinic_review' }));
  });
  it('lets the patient decline a clinic proposal without cancelling the appointment', () => {
    Object.assign(appointment.rescheduleProposal!, { proposedBySide: 'staff' }); fixture.detectChanges();
    button('Decline proposed time')?.click();
    expect(api.respondToReschedule).toHaveBeenCalledWith(appointment._id, jasmine.objectContaining({ proposalId, method: 'patient_portal', decision: 'decline' }));
    expect(api.cancelAppointment).not.toHaveBeenCalled();
  });
  it('offers a replacement and explicit cancellation after the abandoned original date, with the exact Manila deadline', () => {
    appointment.status = AppointmentStatus.NEEDS_RESCHEDULING; appointment.date = new Date('2020-11-02'); appointment.rescheduleProposal = undefined;
    Object.assign(appointment.closureRescheduling!, { expiresAt: '2030-10-29T04:00:00Z' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Oct 29, 2030');
    expect(fixture.nativeElement.textContent).toContain('Equipment repairs');
    expect(button('Propose replacement')?.disabled).toBeFalse();
    dialog.and.returnValue({ afterClosed: () => of({ date: new Date('2030-11-04'), startTime: '11:00', endTime: '11:30', reason: 'Replacement' }) });
    button('Propose replacement')?.click(); expect(api.rescheduleAppointment).toHaveBeenCalled();
    expect(button('Cancel appointment')).toBeDefined();
  });
});
