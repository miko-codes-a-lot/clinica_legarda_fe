import { ClosuresApiService } from '../../care/closures/closures-api.service';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, throwError } from 'rxjs';
import { Clinic } from '../model/clinic';
import { DentistDirectoryEntry } from '../model/user-directory';
import { createBookingSchedule, DentistBookingSchedule, isBookableDentist } from '../model/booking-availability';
import { AppointmentService } from './appointment-service';

@Injectable({ providedIn: 'root' })
export class BookingAvailabilityService {
  constructor(private readonly appointments: AppointmentService, private readonly closures: ClosuresApiService) {}

  load(dentist: DentistDirectoryEntry, clinic: Clinic, excludeAppointmentId?: string): Observable<DentistBookingSchedule> {
    if (!dentist._id || !clinic._id || !isBookableDentist(dentist, clinic._id)) {
      return throwError(() => new Error('This dentist is not available at the selected clinic.'));
    }
    return forkJoin({ slots: this.appointments.getAvailability(dentist._id), closures: this.closures.availability(clinic._id) }).pipe(
      map(result => createBookingSchedule(dentist, clinic, result.slots, excludeAppointmentId, result.closures)),
    );
  }
}
