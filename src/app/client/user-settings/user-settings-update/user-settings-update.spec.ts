import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSettingsUpdate } from './user-settings-update';

describe('UserSettingsUpdate', () => {
  let component: UserSettingsUpdate;
  let fixture: ComponentFixture<UserSettingsUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSettingsUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSettingsUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
