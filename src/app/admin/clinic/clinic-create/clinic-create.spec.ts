import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicCreate } from './clinic-create';

describe('ClinicCreate', () => {
  let component: ClinicCreate;
  let fixture: ComponentFixture<ClinicCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClinicCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
