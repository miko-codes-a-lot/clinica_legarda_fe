import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DentalServiceList } from './dental-service-list';

describe('DentalServiceList', () => {
  let component: DentalServiceList;
  let fixture: ComponentFixture<DentalServiceList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DentalServiceList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DentalServiceList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
