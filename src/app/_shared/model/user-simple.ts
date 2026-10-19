import { PatientDemographics } from './patient-demographics';
import { Clinic } from "./clinic"
import { OperatingHour } from "./operating-hour"
import { UserStatus } from "../../_shared/model/user"

export interface UserSimple extends PatientDemographics {
    _id: string
    firstName: string
    middleName: string
    lastName: string
    emailAddress: string
    mobileNumber: string
    address: string
    password?: string
    clinic?: Clinic
    clinics?: (Clinic | string)[]
    operatingHours: OperatingHour[]
    role: string
    username: string
    profilePicture?: string
    createdAt: string 
    updatedAt: string
    status?: UserStatus
    isDependent?: boolean
    guardian?: string
    loginEnabled?: boolean
    verificationSource?: 'email' | 'guardian'
    isWalkIn?: boolean
}
