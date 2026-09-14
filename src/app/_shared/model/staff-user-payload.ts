import { OperatingHour } from './operating-hour';
import { UserStatus } from './user';

export interface StaffUserPayload {
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
}

export interface StaffUserFormValue {
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
}

export function buildStaffUserPayload(value: StaffUserFormValue): StaffUserPayload {
  const isDentist = value.role === 'dentist';

  return {
    firstName: value.firstName,
    middleName: value.middleName,
    lastName: value.lastName,
    emailAddress: value.emailAddress,
    mobileNumber: value.mobileNumber,
    address: value.address,
    username: value.username,
    ...(value.password ? { password: value.password } : {}),
    clinics: isDentist ? value.clinics : [],
    operatingHours: isDentist ? value.operatingHours : [],
    role: value.role,
  };
}
