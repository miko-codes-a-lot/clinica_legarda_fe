import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dentist } from './dentist';

describe('Dentist', () => {
  let component: Dentist;
  let fixture: ComponentFixture<Dentist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dentist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dentist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
