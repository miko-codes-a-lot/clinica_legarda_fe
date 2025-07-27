import { Clinic } from "./clinic"

export interface Branch {
  _id?: string
  name: string
  address: string
  mobileNumber: string
  emailAddress: string
  clinic: Clinic
}