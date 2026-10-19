import { ClosuresApiService } from '../../care/closures/closures-api.service';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, throwError } from 'rxjs';
import { Clinic } from '../model/clinic';
import { DentistDirectoryEntry } from '../model/user-directory';
import { createBookingSchedule, DentistBookingSchedule, isBookableDentist } from '../model/booking-availability';
import { AppointmentService } from './appointment-service';
import { DentistAvailabilityApi } from './dentist-availability-api';
import { clinicToday } from '../../care/care.models';

@Injectable({ providedIn: 'root' })
export class BookingAvailabilityService {
  constructor(private readonly appointments: AppointmentService, private readonly closures: ClosuresApiService, private readonly days: DentistAvailabilityApi) {}

  load(dentist: DentistDirectoryEntry, clinic: Clinic, excludeAppointmentId?: string): Observable<DentistBookingSchedule> {
    if (!dentist._id || !clinic._id || !isBookableDentist(dentist, clinic._id)) {
      return throwError(() => new Error('This dentist is not available at the selected clinic.'));
    }
    const from = clinicToday(), to = new Date(Date.parse(from) + 366 * 86400000).toISOString().slice(0, 10);
    return forkJoin({ slots: this.appointments.getAvailability(dentist._id), closures: this.closures.availability(clinic._id), days: this.days.publicDays(dentist._id, clinic._id, from, to) }).pipe(
      map(result => createBookingSchedule(dentist, clinic, result.slots, excludeAppointmentId, result.closures, result.days)),
    );
  }
}
