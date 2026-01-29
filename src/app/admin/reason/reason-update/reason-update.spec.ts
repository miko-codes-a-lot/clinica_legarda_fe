import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasonUpdate } from './reason-update';

describe('ReasonUpdate', () => {
  let component: ReasonUpdate;
  let fixture: ComponentFixture<ReasonUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReasonUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReasonUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
