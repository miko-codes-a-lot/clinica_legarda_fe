import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DentalServiceUpdate } from './dental-service-update';

describe('DentalServiceUpdate', () => {
  let component: DentalServiceUpdate;
  let fixture: ComponentFixture<DentalServiceUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DentalServiceUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DentalServiceUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
