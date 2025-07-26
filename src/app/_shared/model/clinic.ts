import { OperatingHour } from "./operating-hour"

export interface Clinic {
  _id?: string
  name: string
  address: string
  mobileNumber: string
  emailAddress: string
  operatingHours: OperatingHour[]
}