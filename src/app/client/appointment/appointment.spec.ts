import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentPage } from './appointment';

describe('Appointment', () => {
  let component: AppointmentPage;
  let fixture: ComponentFixture<AppointmentPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
