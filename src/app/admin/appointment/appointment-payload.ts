import { AppointmentHistory, AppointmentNote, AppointmentStatus } from "../../_shared/model/appointment"

export interface AppointmentPayload {
    patient: string
    dentist: string
    services: string[]
    date: Date
    status: AppointmentStatus
    notes: AppointmentNote
    history: AppointmentHistory[]
}