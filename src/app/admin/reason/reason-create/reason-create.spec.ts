import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasonCreate } from './reason-create';

describe('ReasonCreate', () => {
  let component: ReasonCreate;
  let fixture: ComponentFixture<ReasonCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReasonCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReasonCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
