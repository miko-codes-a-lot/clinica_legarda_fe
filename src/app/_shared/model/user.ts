import { Appointment } from "./appointment"
import { Clinic } from "./clinic"
import { OperatingHour } from "./operating-hour"

export enum UserStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

export interface User {
  _id?: string
  firstName: string
  middleName: string
  lastName: string
  emailAddress: string
  mobileNumber: string
  address: string
  username?: string
  password?: string
  clinic?: Clinic
  operatingHours: OperatingHour[]
  appointments: Appointment[]
  role: string
  status?: UserStatus
}