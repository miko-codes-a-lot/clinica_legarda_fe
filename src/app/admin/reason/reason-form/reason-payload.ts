import { ReasonUsage } from '../../../_shared/model/reason';

export interface ReasonPayload {
  code: string;            // unique code identifier
  label: string;           // displayed text
  description?: string;    // optional detailed explanation
  usage: ReasonUsage;      // usage type: referral, decline, or both
  isActive: boolean;       // whether this reason is active
}