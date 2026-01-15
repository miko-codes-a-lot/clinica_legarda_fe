import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferralRequestDetails } from './referral-request-details';

describe('ReferralRequestDetails', () => {
  let component: ReferralRequestDetails;
  let fixture: ComponentFixture<ReferralRequestDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferralRequestDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReferralRequestDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
