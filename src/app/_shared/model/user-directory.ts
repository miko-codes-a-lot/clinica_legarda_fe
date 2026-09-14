import { User } from './user';

export type PatientDirectoryEntry = Pick<User,
  '_id' | 'firstName' | 'middleName' | 'lastName' | 'role' | 'status'>;

export type DentistDirectoryEntry = PatientDirectoryEntry & Pick<User,
  'clinic' | 'clinics' | 'operatingHours' | 'appointmentBufferMinutes' | 'maxWorkingMinutesPerDay'> & {
    profilePicture?: string;
  };
