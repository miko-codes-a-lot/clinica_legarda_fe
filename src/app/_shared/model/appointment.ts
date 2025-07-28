import { DentalService } from "./dental-service"
import { User } from "./user"

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected'
}

export interface AppointmentNote {
  patientNotes: string
  clinicNotes: string
}

export interface AppointmentHistory {
  timestamp: Date
  action: string
}

export interface Appointment {
  _id: string
  patient: User
  dentist: User
  services: DentalService[]
  date: Date
  status: AppointmentStatus
  notes: AppointmentNote
  history: AppointmentHistory[]
}