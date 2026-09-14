import { User } from './user';

export type PersonSummary = Pick<User,
  '_id' | 'firstName' | 'middleName' | 'lastName' | 'role' | 'status'>;

export type PatientDirectoryEntry = PersonSummary;

export type DentistDirectoryEntry = PersonSummary & Pick<User,
  'clinic' | 'clinics' | 'operatingHours' | 'appointmentBufferMinutes' | 'maxWorkingMinutesPerDay'> & {
    profilePicture?: string;
  };
