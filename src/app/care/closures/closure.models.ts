import { CareAppointment, CareClinic, CarePerson } from '../care.models';
export interface ClosureInterval { startDate: string; endDate: string; startTime: string; endTime: string; }
export interface ClinicClosure extends ClosureInterval {
  _id: string; clinic: CareClinic; reason: string; status: 'active' | 'reopened'; createdByName: string;
  reopenedAt?: string; reopenedByName?: string; reopenReason?: string; affectedAppointments: string[];
}
export interface AppointmentDisruption { closures: string[]; flaggedAt: string; message: string; }
export type AffectedAppointment = Pick<CareAppointment, '_id' | 'dentist' | 'clinic' | 'date' | 'startTime' | 'endTime' | 'status'> & { patient: CarePerson; disruption?: AppointmentDisruption };
export interface ClosureDetail { closure: ClinicClosure; appointments: AffectedAppointment[]; }
export interface ClosurePayload extends ClosureInterval { clinic: string; reason: string; }
