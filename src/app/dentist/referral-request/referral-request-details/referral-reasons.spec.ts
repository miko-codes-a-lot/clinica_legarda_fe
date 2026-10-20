import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ReferralRequestDetails } from './referral-request-details';
import { ReferralService } from '../../../_shared/service/referral-service';
import { ReasonService } from '../../../_shared/service/reason-service';
import { AlertService } from '../../../_shared/service/alert.service';
import { AuthService } from '../../../_shared/service/auth-service';
import { AppointmentReasonDialogComponent } from '../../../_shared/component/dialog/appointment-reason-dialog/appointment-reason-dialog.component';
describe('Referral text and legacy reason display', () => {
  let reason: string, open: jasmine.Spy, reject: jasmine.Spy;
  beforeEach(() => {
    reason = 'X'; open = jasmine.createSpy('open').and.returnValue({ afterClosed: () => of('Specialist unavailable this week') });
    reject = jasmine.createSpy('reject').and.returnValue(of({}));
    TestBed.configureTestingModule({ providers: [
      { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'referral' } } } },
      { provide: MatDialog, useValue: { open } },
      { provide: ReferralService, useValue: { getOne: () => of({ _id: 'referral', reason, status: 'pending', fromDoctorId: { _id: 'dentist' }, patient: { _id: 'patient', firstName: 'Active', lastName: 'Patient' }, appointment: null }), rejectReferral: reject } },
      { provide: ReasonService, useValue: { getAll: () => of([{ code: 'X', label: 'Legacy patient request', isActive: false, usage: 'referral' }]) } },
      { provide: AlertService, useValue: { error: () => {} } }, { provide: AuthService, useValue: { currentUserValue: { _id: 'dentist' } } },
    ] });
  });
  it('shows an old catalogue code label even if that reason is inactive', () => {
    const fixture = TestBed.createComponent(ReferralRequestDetails); fixture.detectChanges();
    expect(fixture.componentInstance.displayReferral['Reason for Referral']).toBe('Legacy patient request'); fixture.destroy();
  });
  it('labels a deleted unlinked patient and disables referral decisions', () => {
    const fixture = TestBed.createComponent(ReferralRequestDetails); fixture.detectChanges();
    const page = fixture.componentInstance;
    if (!page.referral?.patient) throw new Error('Missing fixture patient');
    page.referral.patient.deletedAt = '2026-10-21';
    expect(page.isActionDisabled()).toBeTrue();
    page.declineReferral(); expect(open).not.toHaveBeenCalled(); fixture.destroy();
  });
  it('renders new text inertly and accepts a decline without catalogue choices', () => {
    reason = '<script>Patient needs specialist care</script>';
    const fixture = TestBed.createComponent(ReferralRequestDetails); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(reason); expect(fixture.nativeElement.querySelector('script')).toBeNull();
    fixture.componentInstance.declineReferral();
    expect(open).toHaveBeenCalledWith(AppointmentReasonDialogComponent, jasmine.objectContaining({ data: { action: 'reject', subject: 'referral' } }));
    expect(reject).toHaveBeenCalledWith('referral', 'Specialist unavailable this week'); fixture.destroy();
  });
});
