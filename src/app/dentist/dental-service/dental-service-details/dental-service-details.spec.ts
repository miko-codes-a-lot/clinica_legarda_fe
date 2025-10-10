import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DentalServiceDetails } from './dental-service-details';

describe('DentalServiceDetails', () => {
  let component: DentalServiceDetails;
  let fixture: ComponentFixture<DentalServiceDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DentalServiceDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DentalServiceDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
