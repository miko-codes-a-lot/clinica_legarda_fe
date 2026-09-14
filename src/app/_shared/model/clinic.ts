import { Branch } from "./branch"
import { OperatingHour } from "./operating-hour"
import { DentistDirectoryEntry } from "./user-directory"

export interface Clinic {
  _id?: string
  name: string
  address: string
  mobileNumber: string
  emailAddress: string
  operatingHours: OperatingHour[]
  dentists: DentistDirectoryEntry[]
  // branches: Branch[]
}