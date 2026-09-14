import { Clinic } from './clinic';
import { User, UserStatus } from './user';
import { AppointmentStatus } from './appointment';
import { bookingSlots, createBookingSchedule } from './booking-availability';

const clinic: Clinic = {
  _id: 'annex', name: 'Annex', address: '', emailAddress: '', mobileNumber: '', dentists: [],
  operatingHours: [{ day: 'monday', startTime: '09:00', endTime: '12:00' }],
};
const dentist: User = {
  _id: 'dentist', firstName: 'Test', middleName: '', lastName: 'Dentist', emailAddress: '',
  mobileNumber: '', address: '', role: 'dentist', status: UserStatus.CONFIRMED,
  clinics: ['main', 'annex'], appointments: [],
  operatingHours: [{ day: 'monday', startTime: '08:00', endTime: '17:00' }],
};
const occupied = [{ _id: 'visit', date: '2026-09-21T00:00:00.000Z', startTime: '09:00', endTime: '10:00', status: AppointmentStatus.CONFIRMED }];
const day = new Date(2026, 8, 21);
const now = new Date('2026-09-14T00:00:00Z');

describe('booking availability', () => {
  it('intersects clinic and dentist hours and blocks occupied times from every clinic with a buffer', () => {
    const schedule = createBookingSchedule(dentist, clinic, occupied);
    const slots = bookingSlots(schedule, day, 30, 15, now);
    expect(slots[0].value).toBe('09:00');
    expect(slots.at(-1)?.value).toBe('11:30');
    expect(slots.find(slot => slot.value === '10:00')?.available).toBeFalse();
    expect(slots.find(slot => slot.value === '10:15')?.available).toBeTrue();
  });

  it('excludes the current appointment when proposing a reschedule', () => {
    const schedule = createBookingSchedule(dentist, clinic, occupied, 'visit');
    expect(bookingSlots(schedule, day, 60, 30, now).find(slot => slot.value === '09:00')?.available).toBeTrue();
  });

  it('applies daily capacity across clinics even when the selected clinic has an open slot', () => {
    const schedule = createBookingSchedule({ ...dentist, maxWorkingMinutesPerDay: 100 }, clinic, occupied);
    expect(bookingSlots(schedule, day, 30, 15, now).some(slot => slot.available)).toBeFalse();
  });

  it('uses the Manila calendar day for past times and the selected service duration for closing time', () => {
    const schedule = createBookingSchedule(dentist, clinic, []);
    const slots = bookingSlots(schedule, day, 60, 30, new Date('2026-09-21T02:00:01Z'));
    expect(slots.find(slot => slot.value === '10:00')?.available).toBeFalse();
    expect(slots.find(slot => slot.value === '10:30')?.available).toBeTrue();
    expect(slots.at(-1)?.value).toBe('11:00');
  });
});
