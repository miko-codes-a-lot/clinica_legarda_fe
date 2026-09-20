import { Clinic } from "./clinic"
import { Referral } from "./referral"
import { DentalService } from "./dental-service"
import { User } from "./user"

export enum AppointmentStatus {
  PENDING = 'pending',
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
  status: AppointmentStatus
  notes: AppointmentNote
  history: AppointmentHistory[],
  createdBy?: string
  referral?: Referral
  createdAt?: string,
  updatedAt?: string
}
