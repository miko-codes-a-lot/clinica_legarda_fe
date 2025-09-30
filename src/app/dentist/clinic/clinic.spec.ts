import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Clinic } from './clinic';

describe('Clinic', () => {
  let component: Clinic;
  let fixture: ComponentFixture<Clinic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Clinic]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Clinic);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
