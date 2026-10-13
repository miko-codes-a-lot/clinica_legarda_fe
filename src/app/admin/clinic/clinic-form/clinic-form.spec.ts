import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicForm } from './clinic-form';

describe('ClinicForm', () => {
  let component: ClinicForm;
  let fixture: ComponentFixture<ClinicForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClinicForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClinicForm);
    component = fixture.componentInstance;
    component.clinic = { name: 'Clinic', address: 'Manila', mobileNumber: '+639171234567', emailAddress: 'clinic@example.test', dentists: [],
      operatingHours: [{ day: 'monday', startTime: '09:30', endTime: '16:00' }], appointmentOnlyDays: ['sunday'] };
    component.days = [{ code: 'monday', label: 'Monday' }, { code: 'sunday', label: 'Sunday' }];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('preserves appointment-only Sunday without inventing fixed hours when clinic details are saved', () => {
    const emit = spyOn(component.onSubmitEvent, 'emit');
    component.onSubmit();
    expect(emit).toHaveBeenCalledWith(jasmine.objectContaining({ appointmentOnlyDays: ['sunday'],
      operatingHours: [{ day: 'monday', startTime: '09:30', endTime: '16:00' }] }));
    expect(fixture.nativeElement.querySelector('input[aria-label="Sunday by appointment"]')?.checked).toBeTrue();
  });

  it('converts a fixed clinic day into by-appointment availability when its checkbox is selected', () => {
    const emit = spyOn(component.onSubmitEvent, 'emit');
    const checkbox = fixture.nativeElement.querySelector('input[aria-label="Monday by appointment"]') as HTMLInputElement | null;
    expect(checkbox).not.toBeNull();
    if (!checkbox) return;
    checkbox.click();
    fixture.detectChanges();
    component.onSubmit();
    expect(emit).toHaveBeenCalledWith(jasmine.objectContaining({ appointmentOnlyDays: ['monday', 'sunday'], operatingHours: [] }));
  });

  it('requires explicit fixed times before replacing appointment-only availability', () => {
    const emit = spyOn(component.onSubmitEvent, 'emit');
    const checkbox = fixture.nativeElement.querySelector('input[aria-label="Sunday by appointment"]') as HTMLInputElement | null;
    expect(checkbox).not.toBeNull();
    if (!checkbox) return;
    checkbox.click();
    fixture.detectChanges();
    component.onSubmit();
    expect(emit).not.toHaveBeenCalled();
    const starts = fixture.nativeElement.querySelectorAll('input[type="time"]') as NodeListOf<HTMLInputElement>;
    starts[2].value = '11:00'; starts[2].dispatchEvent(new Event('input', { bubbles: true }));
    starts[3].value = '16:00'; starts[3].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    component.onSubmit();
    expect(emit).toHaveBeenCalledWith(jasmine.objectContaining({ appointmentOnlyDays: [], operatingHours: [
      { day: 'monday', startTime: '09:30', endTime: '16:00' }, { day: 'sunday', startTime: '11:00', endTime: '16:00' },
    ] }));
  });
});
