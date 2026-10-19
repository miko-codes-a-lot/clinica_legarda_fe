import { TestBed } from '@angular/core/testing';
import { BookingCalendar } from './booking-calendar';
import { AppointmentStatus } from '../../model/appointment';

describe('Inline booking calendar', () => {
  beforeEach(() => { jasmine.clock().install(); jasmine.clock().mockDate(new Date('2026-10-20T00:00:00Z')); });
  afterEach(() => jasmine.clock().uninstall());
  function calendar() {
    const fixture = TestBed.createComponent(BookingCalendar);
    fixture.componentRef.setInput('schedule', {
      operatingHours: [{ day: 'wednesday', startTime: '09:00', endTime: '14:00' }],
      appointments: [{ date: '2026-10-21', startTime: '09:00', endTime: '10:00', status: AppointmentStatus.CONFIRMED }],
      datedAvailability: [{ date: '2026-10-21', intervals: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '13:00', endTime: '14:00' }] }],
      appointmentBufferMinutes: 15,
    });
    fixture.componentRef.setInput('date', new Date(2026, 9, 21)); fixture.componentRef.setInput('duration', 30); fixture.detectChanges();
    return fixture;
  }
  it('labels unavailable slots and only emits an available time', () => {
    const fixture = calendar(), component = fixture.componentInstance; spyOn(component.timeChange, 'emit');
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button.slot')) as HTMLButtonElement[];
    expect(buttons.find(button => button.textContent?.includes('9:00 AM'))?.disabled).toBeTrue();
    expect(buttons.find(button => button.textContent?.includes('9:00 AM'))?.textContent).toContain('Booked');
    expect(buttons.find(button => button.textContent?.includes('12:00 PM'))?.textContent).toContain('Dentist unavailable');
    buttons.find(button => button.textContent?.includes('10:30 AM'))?.click();
    expect(component.timeChange.emit).toHaveBeenCalledWith('10:30'); fixture.destroy();
  });
  it('has keyboard-focusable available buttons and a visible empty state when duration no longer fits', () => {
    const fixture = calendar(); fixture.componentRef.setInput('duration', 240); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No available times');
    expect(fixture.componentInstance.slots.some(slot => slot.available)).toBeFalse(); fixture.destroy();
  });
  it('clears time before selecting another calendar day', () => {
    const fixture = calendar(), component = fixture.componentInstance;
    spyOn(component.timeChange, 'emit'); spyOn(component.dateChange, 'emit');
    const next = new Date(2026, 9, 22); component.selectDate(next);
    expect(component.timeChange.emit).toHaveBeenCalledWith(''); expect(component.dateChange.emit).toHaveBeenCalledWith(next);
    fixture.destroy();
  });
});
