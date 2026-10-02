export interface CarePerson {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  username?: string;
  role?: string;
  status?: string;
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
