import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSettingsIndex } from './user-settings-index';

describe('UserSettingsIndex', () => {
  let component: UserSettingsIndex;
  let fixture: ComponentFixture<UserSettingsIndex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSettingsIndex]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSettingsIndex);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
