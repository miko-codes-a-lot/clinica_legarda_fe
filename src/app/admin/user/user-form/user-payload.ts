import { OperatingHour } from "../../../_shared/model/operating-hour"

export interface UserPayload {
  _id?: string
  firstName: string
  middleName: string
  lastName: string
  emailAddress: string
  mobileNumber: string
  address: string
  password?: string
  clinic?: string
  operatingHours: OperatingHour[]
  role: string
  username?: string
}