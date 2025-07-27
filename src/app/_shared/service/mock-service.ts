import { Injectable } from '@angular/core';
import { Clinic } from '../model/clinic';

@Injectable({
  providedIn: 'root'
})
export class MockService {
  mockBranch(): import("../model/branch").Branch {
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
        ]
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
      ]
    }
  }
}
