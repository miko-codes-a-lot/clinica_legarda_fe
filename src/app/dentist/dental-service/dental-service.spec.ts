import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DentalService } from './dental-service';

describe('DentalService', () => {
  let component: DentalService;
  let fixture: ComponentFixture<DentalService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DentalService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DentalService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
