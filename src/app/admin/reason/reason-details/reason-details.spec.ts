import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasonDetails } from './reason-details';

describe('ReasonDetails', () => {
  let component: ReasonDetails;
  let fixture: ComponentFixture<ReasonDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReasonDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReasonDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
