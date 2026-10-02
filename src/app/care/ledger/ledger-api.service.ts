import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { InstallmentItem, LedgerChargePayload, LedgerEntry, LedgerPaymentPayload, PatientLedger } from './ledger.models';
@Injectable({ providedIn: 'root' })
export class LedgerApiService {
  constructor(private readonly http: HttpClient) {}
  record(patient: string, clinic?: string, self = false) {
    return this.http.get<PatientLedger>(self ? '/ledger/my-record' : `/ledger/patients/${patient}`, { params: clinic ? new HttpParams().set('clinic', clinic) : undefined });
  }
  charge(payload: LedgerChargePayload) { return this.http.post<LedgerEntry>('/ledger/charges', payload); }
  payment(payload: LedgerPaymentPayload) { return this.http.post<LedgerEntry>('/ledger/payments', payload); }
  void(id: string, reason: string) { return this.http.patch<LedgerEntry>(`/ledger/entries/${id}/void`, { reason }); }
  installments(charge: string, items: InstallmentItem[]) { return this.http.post('/ledger/installments', { charge, items }); }
  revise(id: string, revision: number, items: InstallmentItem[], reason: string) { return this.http.patch(`/ledger/installments/${id}`, { revision, items, reason }); }
}
