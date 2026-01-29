import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasonForm } from './reason-form';

describe('ReasonForm', () => {
  let component: ReasonForm;
  let fixture: ComponentFixture<ReasonForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReasonForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReasonForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
