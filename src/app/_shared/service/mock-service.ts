import { Injectable } from '@angular/core';
import { Clinic } from '../model/clinic';
import { DentalService } from '../model/dental-service';
import { Appointment, AppointmentStatus } from '../model/appointment';
import { User } from '../model/user';
import { Branch } from '../model/branch';

@Injectable({
  providedIn: 'root'
})
export class MockService {
  mockUser(): User {
    return {
        _id: '1',
        firstName: 'Juan',
        middleName: 'Della',
        lastName: 'Cruz',
        emailAddress: 'juan@gmail.com',
        mobileNumber: '09394252236',
        address: 'blk 2 lot 75',
        role: 'dentist',
        branch: '1',
        clinic: '1',        
        operatingHours: [
          { day: 'monday', startTime: '09:00', endTime: '18:00' },
          { day: 'tuesday', startTime: '09:00', endTime: '18:00' },
          { day: 'wednesday', startTime: '09:00', endTime: '18:00' },
          { day: 'thursday', startTime: '09:00', endTime: '18:00' },
          { day: 'friday', startTime: '09:00', endTime: '18:00' },
          { day: 'saturday', startTime: '10:00', endTime: '15:00' },
          { day: 'sunday', startTime: '10:00', endTime: '15:00' },
        ],
    }
  }

  mockBranch(): Branch {
    return {
      _id: '1',
      name: 'Branch A',
      address: '2275 Legarda st. Sampaloc Manila',
      mobileNumber: '+639391112236',
      emailAddress: 'contact@clinicalegarda.com',
      clinic: {
        _id: '1',
        name: 'Clinica Legarda Dental Clinic',
        address: '2275 Legarda st. Sampaloc Manila',
        mobileNumber: '+639391112236',
        emailAddress: 'contact@clinicalegarda.com',
        operatingHours: [
          { day: 'monday', startTime: '09:00', endTime: '18:00' },
          { day: 'tuesday', startTime: '09:00', endTime: '18:00' },
          { day: 'wednesday', startTime: '09:00', endTime: '18:00' },
          { day: 'thursday', startTime: '09:00', endTime: '18:00' },
          { day: 'friday', startTime: '09:00', endTime: '18:00' },
          { day: 'saturday', startTime: '10:00', endTime: '15:00' },
          { day: 'sunday', startTime: '10:00', endTime: '15:00' },
        ],
        branches: []
      }
    }
  }

  mockClinic(): Clinic {
    return {
      _id: '1',
      name: 'Clinica Legarda Dental Clinic',
      address: '2275 Legarda st. Sampaloc Manila',
      mobileNumber: '+639391112236',
      emailAddress: 'contact@clinicalegarda.com',
      operatingHours: [
        { day: 'monday', startTime: '09:00', endTime: '18:00' },
        { day: 'tuesday', startTime: '09:00', endTime: '18:00' },
        { day: 'wednesday', startTime: '09:00', endTime: '18:00' },
        { day: 'thursday', startTime: '09:00', endTime: '18:00' },
        { day: 'friday', startTime: '09:00', endTime: '18:00' },
        { day: 'saturday', startTime: '10:00', endTime: '15:00' },
        { day: 'sunday', startTime: '10:00', endTime: '15:00' },
      ],
      branches: [
        this.mockBranch()
      ]
    }
  }

  mockDentalService(): DentalService {
    return {
      _id: '1',
      name: 'Dental Cleaning',
    }
  }

  mockAppointment(): Appointment {
    return {
      _id: '1',
      dentist: this.mockUser(),
      patient: this.mockUser(),
      date: new Date(),
      services: [
        this.mockDentalService()
      ],
      status: AppointmentStatus.PENDING,
      notes: {
        clinicNotes: '',
        patientNotes: '',
      },
      history: [],
    }
  }
}
