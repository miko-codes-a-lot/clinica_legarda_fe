import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyAppointment } from './my-appointment';

describe('MyAppointment', () => {
  let component: MyAppointment;
  let fixture: ComponentFixture<MyAppointment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyAppointment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyAppointment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
