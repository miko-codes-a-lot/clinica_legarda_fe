import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferralRequestList } from './referral-request-list';

describe('ReferralRequestList', () => {
  let component: ReferralRequestList;
  let fixture: ComponentFixture<ReferralRequestList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferralRequestList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReferralRequestList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
