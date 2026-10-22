import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { OverlayContainer } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, of } from 'rxjs';
import { ReferralRequestDetails } from './referral-request-details';
import { ReferralService } from '../../../_shared/service/referral-service';
import { ReasonService } from '../../../_shared/service/reason-service';
import { AlertService } from '../../../_shared/service/alert.service';
import { AuthService } from '../../../_shared/service/auth-service';
import { dentistAppointment } from '../../appointment/appointment-test-fixtures';
import { ReferralStatus } from '../../../_shared/model/referral';

describe('Referral approval confirmation', () => {
  let fixture: ComponentFixture<ReferralRequestDetails>, overlay: HTMLElement, approve: jasmine.Spy;
  beforeEach(async () => {
    const referral = { _id: 'referral', fromDoctorId: { _id: 'referring-dentist' },
      reason: 'Patient needs specialist care', status: ReferralStatus.PENDING,
      appointment: dentistAppointment(),
    };
    approve = jasmine.createSpy('approve').and.callFake(() => {
      referral.status = ReferralStatus.CONFIRMED;
      return of(referral);
    });
    await TestBed.configureTestingModule({ imports: [ReferralRequestDetails], providers: [
      { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'referral' } } } },
      { provide: ReferralService, useValue: { getOne: () => of(referral), approveReferral: approve } },
      { provide: ReasonService, useValue: { getAll: () => of([]) } },
      { provide: AlertService, useValue: { error: jasmine.createSpy() } },
      { provide: AuthService, useValue: { currentUserValue: { _id: 'referring-dentist' } } },
    ] }).compileComponents();
    fixture = TestBed.createComponent(ReferralRequestDetails); fixture.detectChanges();
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
  });
  afterEach(() => { TestBed.inject(MatDialog).closeAll(); fixture.destroy(); });
  const choice = (label: string) => Array.from(overlay.querySelectorAll('button')).find(button => button.textContent?.trim() === label);

  it('allows explicit approval without a consent checkbox and submits once', async () => {
    fixture.componentInstance.approveReferral(); fixture.detectChanges(); await fixture.whenStable();
    expect(overlay.querySelector('mat-checkbox')).toBeNull();
    expect(overlay.textContent?.toLowerCase()).not.toContain('consent');
    expect(approve).not.toHaveBeenCalled();
    const yes = choice('Yes'); expect(yes).toBeDefined(); expect(yes?.disabled).toBeFalse();
    const closed = firstValueFrom(TestBed.inject(MatDialog).openDialogs[0].afterClosed());
    yes?.click(); await closed; fixture.detectChanges(); await fixture.whenStable();
    expect(approve).toHaveBeenCalledOnceWith('referral');
    expect(fixture.componentInstance.referral?.status).toBe(ReferralStatus.CONFIRMED);
    fixture.componentInstance.approveReferral(); expect(approve).toHaveBeenCalledTimes(1);
  });
  it('leaves the referral pending when confirmation is cancelled', async () => {
    fixture.componentInstance.approveReferral(); fixture.detectChanges(); await fixture.whenStable();
    const closed = firstValueFrom(TestBed.inject(MatDialog).openDialogs[0].afterClosed());
    choice('No')?.click(); await closed; fixture.detectChanges(); await fixture.whenStable();
    expect(approve).not.toHaveBeenCalled();
    expect(fixture.componentInstance.referral?.status).toBe(ReferralStatus.PENDING);
  });
});
