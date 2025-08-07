import { Branch } from "./branch"
import { OperatingHour } from "./operating-hour"
import { User } from "./user"

export interface Clinic {
  _id?: string
  name: string
  address: string
  mobileNumber: string
  emailAddress: string
  operatingHours: OperatingHour[]
  dentists: User[]
  // branches: Branch[]
}