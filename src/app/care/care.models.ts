import { UserStatus } from '../_shared/model/user';

export interface CarePerson {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  username?: string;
  role?: string;
  status?: UserStatus;
  isWalkIn?: boolean;
  emailAddress?: string;
  mobileNumber?: string;
  address?: string;
}

export interface CareClinic { _id: string; name: string; address?: string; mobileNumber?: string; }
export interface CareAppointment {
  _id: string;
  clinic: CareClinic;
  dentist: CarePerson;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  isWalkIn?: boolean;
  services: { _id: string; name: string }[];
}
export interface PatientSearchResult { items: CarePerson[]; total: number; page: number; pageSize: number; }
export interface PatientRecord { patient: CarePerson; appointments: CareAppointment[]; }
export interface PatientSearchQuery { search?: string; clinic?: string; page?: number; }

export type VisitState = 'waiting' | 'in_progress' | 'completed' | 'cancelled';
export interface CareVisit {
  _id: string;
  patient: CarePerson;
  clinic: CareClinic;
  dentist: CarePerson;
  appointment?: string;
  careCase?: string;
  date: string;
  checkedInAt: string;
  startedAt?: string;
  endedAt?: string;
  state: VisitState;
  purpose: 'consultation' | 'treatment';
  isWalkIn: boolean;
  revision: number;
  events: { state: string; actor: string; at: string; reason?: string }[];
}
export interface CheckInPayload {
  patient: string; clinic: string; dentist: string; appointment?: string;
  purpose: 'consultation' | 'treatment'; isWalkIn: boolean;
}
export function clinicToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
