import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicList } from './clinic-list';

describe('ClinicList', () => {
  let component: ClinicList;
  let fixture: ComponentFixture<ClinicList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClinicList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
