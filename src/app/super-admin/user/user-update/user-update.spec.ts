import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserUpdate } from './user-update';

describe('UserUpdate', () => {
  let component: UserUpdate;
  let fixture: ComponentFixture<UserUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
