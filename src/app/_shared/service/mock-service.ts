import { Injectable } from '@angular/core';
import { Clinic } from '../model/clinic';
import { DentalService } from '../model/dental-service';
import { Appointment, AppointmentStatus } from '../model/appointment';
import { User } from '../model/user';
import { Branch } from '../model/branch';
import { Notification } from '../model/notification';

@Injectable({
  providedIn: 'root'
})
export class MockService {
  mockUserBase(): User {
    return {
        _id: '1',
        firstName: 'Juan',
        middleName: 'Della',
        lastName: 'Cruz',
        emailAddress: 'juan@gmail.com',
        mobileNumber: '09394252236',
        address: 'blk 2 lot 75',
        role: 'dentist',
        appointments: [],
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

  mockUser(): User {
    const mockUser = this.mockUserBase()
    mockUser.clinic = this.mockClinic()
    mockUser.appointments = [this.mockAppointment()]
    return mockUser
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
        dentists: [
          this.mockUserBase()
        ],
        // branches: []
      }
    }
  }

  mockClinicBase(): Clinic {
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
      dentists: []
      // branches: [
      //   this.mockBranch()
      // ]
    }
  }

  mockClinic(): Clinic {
    const mockClinic = this.mockClinicBase()
    mockClinic.dentists = [this.mockUserBase()]
    return mockClinic
  }

  mockDentalService(): DentalService {
    return {
      _id: '1',
      name: 'Dental Cleaning',
      duration: 30,
    }
  }

  mockAppointmentBase(): Appointment {
    return {
      _id: '1',
      clinic: {} as Clinic,
      dentist: {} as User,
      patient: {} as User,
      date: new Date(),
      services: [],
      status: AppointmentStatus.PENDING,
      startTime: '09:00',
      endTime: '10:00',
      notes: {
        clinicNotes: '',
        patientNotes: '',
      },
      history: [],
    }
  }

  mockAppointment(): Appointment {
    const mock = this.mockAppointmentBase()
    mock.clinic = this.mockClinicBase()
    mock.dentist = this.mockUserBase()
    mock.patient = this.mockUserBase()
    mock.services = [this.mockDentalService()]
    return mock
  }

  mockNotification(): Notification {
    return {
      _id: '1',
      type: 'new_booking',
      timestamp: new Date(),
      message: 'Patient Juan Della Cruz booked a new appointment',
      isRead: false,
      targetUser: '1',
      createdBy: this.mockUser(),
    }
  }
}
