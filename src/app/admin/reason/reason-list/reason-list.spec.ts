import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReasonList } from './reason-list';

describe('ReasonList', () => {
  let component: ReasonList;
  let fixture: ComponentFixture<ReasonList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReasonList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReasonList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
