import { Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { Clinic } from '../model/clinic';
import { DentistDirectoryEntry } from '../model/user-directory';
import { createBookingSchedule, DentistBookingSchedule, isBookableDentist } from '../model/booking-availability';
import { AppointmentService } from './appointment-service';

@Injectable({ providedIn: 'root' })
export class BookingAvailabilityService {
  constructor(private readonly appointments: AppointmentService) {}

  load(dentist: DentistDirectoryEntry, clinic: Clinic, excludeAppointmentId?: string): Observable<DentistBookingSchedule> {
    if (!dentist._id || !clinic._id || !isBookableDentist(dentist, clinic._id)) {
      return throwError(() => new Error('This dentist is not available at the selected clinic.'));
    }
    return this.appointments.getAvailability(dentist._id).pipe(
      map(slots => createBookingSchedule(dentist, clinic, slots, excludeAppointmentId)),
    );
  }
}
