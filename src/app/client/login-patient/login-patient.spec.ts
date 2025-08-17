import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginPatient } from './login-patient';

describe('LoginPatient', () => {
  let component: LoginPatient;
  let fixture: ComponentFixture<LoginPatient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPatient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginPatient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
