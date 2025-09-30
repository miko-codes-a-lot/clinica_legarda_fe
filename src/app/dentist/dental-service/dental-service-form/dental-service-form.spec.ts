import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DentalServiceForm } from './dental-service-form';

describe('DentalServiceForm', () => {
  let component: DentalServiceForm;
  let fixture: ComponentFixture<DentalServiceForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DentalServiceForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DentalServiceForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
