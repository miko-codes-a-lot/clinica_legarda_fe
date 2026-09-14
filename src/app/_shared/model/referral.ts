import { PersonSummary, PatientDirectoryEntry } from "./user-directory"
import { Clinic } from './clinic'
import { Appointment } from "./appointment"
import { Reason } from "./reason"


export enum ReferralStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

export interface Referral {
  _id?: string
  fromDoctorId: PersonSummary
  fromClinicId: Clinic
  reason?: string
  appointment: ReferralAppointment | null
  status: ReferralStatus
  reasonOfDecline: string
  updatedAt?: string
}

export type ReferralAppointment = Pick<Appointment,
  '_id' | 'clinic' | 'services' | 'date' | 'startTime' | 'endTime' | 'status'> & {
    dentist: PersonSummary;
    patient: PatientDirectoryEntry;
    notes?: { patientNotes?: string };
  };
