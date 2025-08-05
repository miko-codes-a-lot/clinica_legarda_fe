import { OperatingHour } from "./operating-hour"

export interface User {
  _id?: string
  firstName: string
  middleName: string
  lastName: string
  emailAddress: string
  mobileNumber: string
  address: string
  password?: string
  clinic?: string
  branch?: string
  operatingHours: OperatingHour[]
  role: string
}