import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferralRequest } from './referral-request';

describe('ReferralRequest', () => {
  let component: ReferralRequest;
  let fixture: ComponentFixture<ReferralRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferralRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReferralRequest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
