import { Clinic } from "./clinic"
import { OperatingHour } from "./operating-hour"

export interface UserSimple {
    _id: string
    firstName: string
    middleName: string
    lastName: string
    emailAddress: string
    mobileNumber: string
    address: string
    password?: string
    clinic?: Clinic
    operatingHours: OperatingHour[]
    role: string
    username: string
    profilePicture?: string
    createdAt: string 
    updatedAt: string 
}