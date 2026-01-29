import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reason } from './reason';

describe('Reason', () => {
  let component: Reason;
  let fixture: ComponentFixture<Reason>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reason]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Reason);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
