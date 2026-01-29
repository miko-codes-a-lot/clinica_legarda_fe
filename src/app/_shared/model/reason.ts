export enum ReasonUsage {
  REFERRAL = 'referral',
  DECLINE = 'decline',
  BOTH = 'both'
}

export interface Reason {
  _id?: string;           // optional, especially for new reasons
  code: string;         // unique code identifier
  label: string;         // displayed text
  description?: string;  // optional detailed explanation
  usage: ReasonUsage;   // usage type: referral, decline, or both
  isActive?: boolean;    // whether this reason is active
  sortOrder?: number;    // order in dropdown or listing
}
