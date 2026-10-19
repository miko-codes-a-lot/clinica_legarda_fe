import { PatientDemographics, demographicValues } from './patient-demographics';
import { OperatingHour } from './operating-hour';
import { UserStatus } from './user';

export interface StaffUserPayload extends PatientDemographics {
  _id?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  emailAddress: string;
  mobileNumber: string;
  address: string;
  password?: string;
  clinic?: string;
  clinics?: string[];
  operatingHours: OperatingHour[];
  role: string;
  username?: string;
  profilePicture?: string;
  status?: UserStatus;
  isWalkIn?: boolean;
}

export interface StaffUserFormValue extends PatientDemographics {
  firstName: string;
  middleName: string;
  lastName: string;
  emailAddress: string;
  mobileNumber: string;
  address: string;
  username?: string;
  password?: string;
  clinics: string[];
  operatingHours: OperatingHour[];
  role: string;
  isWalkIn?: boolean;
}

export function buildStaffUserPayload(value: StaffUserFormValue): StaffUserPayload {
  const isDentist = value.role === 'dentist';

  return {
    ...(value.role === 'user' ? demographicValues(value) : {}),
    firstName: value.firstName,
    middleName: value.middleName,
    lastName: value.lastName,
    emailAddress: value.emailAddress,
    mobileNumber: value.mobileNumber,
    address: value.address,
    username: value.username,
    ...(value.password ? { password: value.password } : {}),
    clinics: isDentist || value.role === 'admin' ? value.clinics : [],
    operatingHours: isDentist ? value.operatingHours : [],
    role: value.role,
    ...(value.isWalkIn !== undefined ? { isWalkIn: value.role === 'user' && value.isWalkIn } : {}),
  };
}
