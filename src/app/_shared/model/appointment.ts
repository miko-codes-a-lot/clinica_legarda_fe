import { Clinic } from "./clinic"
import { DentalService } from "./dental-service"
import { User } from "./user"

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
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
  createdAt?: string;
  updatedAt?: string;
}