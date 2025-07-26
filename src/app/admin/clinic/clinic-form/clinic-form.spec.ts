import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicForm } from './clinic-form';

describe('ClinicForm', () => {
  let component: ClinicForm;
  let fixture: ComponentFixture<ClinicForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClinicForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
