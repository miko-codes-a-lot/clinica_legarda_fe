import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationDetails } from './notification-details';

describe('NotificationDetails', () => {
  let component: NotificationDetails;
  let fixture: ComponentFixture<NotificationDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
