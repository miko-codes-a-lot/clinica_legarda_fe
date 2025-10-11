import { AppointmentHistory, AppointmentNote, AppointmentStatus } from "../../_shared/model/appointment"

export interface AppointmentPayload {
    clinic?: string
    patient: string
    dentist: string
    services: string[]
    date: Date
    startTime: string
    endTime: string
    status: AppointmentStatus
    notes: AppointmentNote
    history?: AppointmentHistory[]
}