import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DentalServiceCreate } from './dental-service-create';

describe('DentalServiceCreate', () => {
  let component: DentalServiceCreate;
  let fixture: ComponentFixture<DentalServiceCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DentalServiceCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DentalServiceCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
