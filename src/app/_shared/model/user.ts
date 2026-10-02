import { Appointment } from "./appointment"
import { Clinic } from "./clinic"
import { OperatingHour } from "./operating-hour"

export enum UserStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  WALK_IN = 'walk_in',
}

export interface User {
  _id?: string
  firstName: string
  middleName: string
  lastName: string
  emailAddress: string
  mobileNumber: string
  address: string
  username?: string
  password?: string
  clinic?: Clinic
  clinics?: (Clinic | string)[]
  operatingHours: OperatingHour[]
  appointmentBufferMinutes?: number
  maxWorkingMinutesPerDay?: number
  appointments: Appointment[]
  role: string
  status?: UserStatus
  isWalkIn?: boolean
}

export function isStaffBookablePatient(patient: Pick<User, 'role' | 'status'>): boolean {
  return patient.role === 'user' && (patient.status === UserStatus.CONFIRMED || patient.status === UserStatus.WALK_IN);
}

export function isOnlineBookablePatient(patient: Pick<User, 'role' | 'status'>): boolean {
  return patient.role === 'user' && patient.status === UserStatus.CONFIRMED;
}

export interface ClinicMembership {
  clinic?: Clinic | string | null;
  clinics?: (Clinic | string | null)[] | null;
}

function membershipReferences(user: ClinicMembership): (Clinic | string | null)[] {
  if (user.clinics !== undefined) return Array.isArray(user.clinics) ? user.clinics : [];
  return user.clinic ? [user.clinic] : [];
}

export function assignedClinicIds(user: ClinicMembership): string[] {
  const ids = membershipReferences(user).map(clinic => typeof clinic === 'string' ? clinic : clinic?._id);
  return [...new Set(ids.filter((id): id is string => !!id))];
}

export function assignedClinics(user: ClinicMembership): Clinic[] {
  return membershipReferences(user).filter((clinic): clinic is Clinic =>
    !!clinic && typeof clinic === 'object' && !!clinic._id,
  );
}
