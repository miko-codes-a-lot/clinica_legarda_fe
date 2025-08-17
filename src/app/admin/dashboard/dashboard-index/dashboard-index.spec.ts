import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardIndex } from './dashboard-index';

describe('DashboardIndex', () => {
  let component: DashboardIndex;
  let fixture: ComponentFixture<DashboardIndex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardIndex]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardIndex);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
