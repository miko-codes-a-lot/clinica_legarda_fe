import { User } from "./user"
import { Clinic } from './clinic'
import { Appointment } from "./appointment"

export enum ReferralStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

export interface Referral {
  _id?: string
  fromDoctorId: User
  fromClinicId: Clinic
  reason?: string
  appointment: Appointment
  status: ReferralStatus
}