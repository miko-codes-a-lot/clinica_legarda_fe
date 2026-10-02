import { CareClinic, CarePerson } from '../care.models';
export interface LedgerEntry {
  _id: string; patient: string; clinic: CareClinic; kind: 'charge' | 'payment'; amount: number; date: string;
  description: string; charge?: string; visit?: string; careCase?: string; method?: string; reference?: string;
  notes?: string; actorName?: string; actorRole?: string; voidedAt?: string; voidReason?: string; createdAt: string;
}
export interface LedgerCharge extends LedgerEntry { paid: number; balance: number; }
export interface InstallmentItem { dueDate: string; amount: number; }
export interface InstallmentPlan {
  _id: string; charge: string; patient: string; clinic: string; revision: number; status: 'active' | 'paid' | 'voided';
  items: (InstallmentItem & { paid: number; remaining: number })[]; overdue: number; upcoming: number;
  history?: { revision: number; items: InstallmentItem[]; actorName: string; at: string; reason: string }[];
}
export interface LedgerTotals { charged: number; paid: number; balance: number; overdue: number; }
export interface PatientLedger {
  patient: CarePerson; currency: 'PHP'; asOf: string; entries: LedgerEntry[]; charges: LedgerCharge[]; plans: InstallmentPlan[];
  totals: LedgerTotals; clinicTotals: (LedgerTotals & { clinic: CareClinic })[];
}
export interface LedgerChargePayload {
  patient: string; clinic: string; amount: number; date: string; description: string; notes?: string; visit?: string; careCase?: string; operationId: string;
}
export interface LedgerPaymentPayload { charge: string; amount: number; date: string; method: string; reference?: string; notes?: string; operationId: string; }
