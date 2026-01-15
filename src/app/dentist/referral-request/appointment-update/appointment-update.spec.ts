import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentUpdate } from './appointment-update';

describe('AppointmentUpdate', () => {
  let component: AppointmentUpdate;
  let fixture: ComponentFixture<AppointmentUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
