import { CareAppointment, CareClinic, CarePerson } from '../care.models';
export interface ClosureInterval { startDate: string; endDate: string; startTime: string; endTime: string; }
export interface ClinicClosure extends ClosureInterval {
  _id: string; clinic: CareClinic; reason: string; status: 'active' | 'reopened'; createdByName: string;
  reopenedAt?: string; reopenedByName?: string; reopenReason?: string; affectedAppointments: string[];
}
export interface AppointmentDisruption { closures: string[]; dentistAvailability?: string[]; flaggedAt: string; message: string; }
export type AffectedAppointment = Pick<CareAppointment, '_id' | 'clinic' | 'date' | 'startTime' | 'endTime' | 'status'> & { patient: CarePerson | null; dentist: CarePerson | null; disruption?: AppointmentDisruption; services?: ({ _id: string; name: string } | null)[]; closureRescheduling?: { expiresAt?: string }; protectedCare?: boolean; closureEffect?: 'needs_rescheduling' | 'already_needs_rescheduling' | 'manual_review'; proposalDeadline?: string };
export interface ClosureDetail { closure: ClinicClosure; appointments: AffectedAppointment[]; }
export interface ClosurePayload extends ClosureInterval { clinic: string; reason: string; impactToken?: string; }

export interface ClosureImpactSummary {
  total: number; newlyNeedsRescheduling: number; alreadyNeedsRescheduling: number; protectedCare: number;
  immediateCancellations: number; cancellationRisk: number;
  distinctPatients: number; distinctDentists: number; distinctServices: number;
  services: { id: string; name: string; appointments: number }[];
  byStatus: Record<string, number>; byDay: Record<string, number>;
  scheduledMinutes: number; firstSchedule: string | null; lastSchedule: string | null;
  urgentAppointments: number; proposalsWithdrawn: number; alreadyDisrupted: number; missingReferenceAppointments: number;
  missingEmailPatients: number; missingSmsPatients: number; manualContactPatients: number;
}
export interface ClosurePreview {
  appointments: AffectedAppointment[]; total: number; generatedAt: string; impactToken: string; summary: ClosureImpactSummary;
}
