import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Miko } from './miko';

describe('Miko', () => {
  let component: Miko;
  let fixture: ComponentFixture<Miko>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Miko]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Miko);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
