import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationCreate } from './registration-create';

describe('RegistrationCreate', () => {
  let component: RegistrationCreate;
  let fixture: ComponentFixture<RegistrationCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrationCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
