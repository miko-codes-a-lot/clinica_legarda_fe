import { AppointmentDisruption } from '../../care/closures/closure.models';
import { Clinic } from "./clinic"
import { Referral } from "./referral"
import { DentalService } from "./dental-service"
import { User } from "./user"

export enum AppointmentStatus {
  PENDING = 'pending',
  NEEDS_RESCHEDULING = 'needs_rescheduling',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show'
}

export interface AppointmentNote {
  patientNotes: string
  clinicNotes: string
}

export interface AppointmentHistory {
  timestamp: Date
  action: string
  reason?: string
  actorId?: string
  actorRole?: string
  actorName?: string
}

export interface Appointment {
  _id: string
  clinic: Clinic
  patient: User
  dentist: User
  services: DentalService[]
  date: Date
  startTime: string
  endTime: string
  scheduleVersion?: number
  rescheduleProposal?: { origin?: 'clinic_closure'; proposedBySide?: 'patient' | 'staff'; proposedBy?: string; id: string; proposedAt: string; reason: string; previousSchedule: { date: string; startTime: string; endTime: string } }
  closureRescheduling?: { originalStatus: string; originalSchedule: { date: string; startTime: string; endTime: string }; enteredAt: string; expiresAt?: string; reasons: string[] }
  status: AppointmentStatus
  isWalkIn?: boolean
  disruption?: AppointmentDisruption;
  careCase?: string
  notes: AppointmentNote
  history: AppointmentHistory[],
  createdBy?: string
  referral?: Referral
  createdAt?: string,
  updatedAt?: string
}
