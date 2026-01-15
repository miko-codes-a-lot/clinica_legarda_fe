import { ReferralStatus } from "../../_shared/model/referral"

export interface ReferralPayload {
    _id?: string
    fromDoctorId: string
    fromClinicId: string
    reason?: string
    appointment?: string
    status: ReferralStatus
}