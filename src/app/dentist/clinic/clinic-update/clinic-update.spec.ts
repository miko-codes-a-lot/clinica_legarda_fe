import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicUpdate } from './clinic-update';

describe('ClinicUpdate', () => {
  let component: ClinicUpdate;
  let fixture: ComponentFixture<ClinicUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClinicUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
