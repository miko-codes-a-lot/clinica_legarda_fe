import { ClinicDate } from '../clinic-date';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, Input, OnChanges } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { AuthService } from '../../_shared/service/auth-service';
import { ClinicService } from '../../_shared/service/clinic-service';
import { EmptyState } from '../../_shared/ui/empty-state/empty-state';
import { StatusBadge } from '../../_shared/ui/status-badge/status-badge';
import { CareClinic, CareVisit, TreatmentCase, clinicToday } from '../care.models';
import { careError } from '../care-api.service';
import { LedgerApiService } from './ledger-api.service';
import { InstallmentPlan, LedgerEntry, PatientLedger } from './ledger.models';
import { formatPesos, monthlyInstallments, parsePesos } from './ledger-rules';
const text = (value = '', required = false, max = 500) => new FormControl(value, { nonNullable: true, validators: [Validators.maxLength(max), ...(required ? [Validators.required] : [])] });
@Component({ selector: 'app-patient-ledger', imports: [ClinicDate, CommonModule, ReactiveFormsModule, EmptyState, StatusBadge], templateUrl: './ledger.html' })
export class PatientLedgerView implements OnChanges {
  @Input({ required: true }) patient = '';
  @Input() clinic = '';
  @Input() self = false;
  @Input() visits: CareVisit[] = [];
  @Input() cases: TreatmentCase[] = [];
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(LedgerApiService);
  private readonly auth = inject(AuthService);
  private readonly clinicsApi = inject(ClinicService);
  readonly money = formatPesos;
  readonly today = clinicToday();
  ledger: PatientLedger | null = null; clinics: CareClinic[] = [];
  loading = false; saving = false; error = ''; success = '';
  mode: '' | 'charge' | 'payment' | 'plan' | 'void' = '';
  selectedEntry: LedgerEntry | null = null; selectedPlan: InstallmentPlan | null = null;
  private chargeOperation = uuid(); private paymentOperation = uuid(); private requestVersion = 0;
  readonly chargeForm = new FormGroup({ clinic: text('', true), amount: text('', true), date: text(this.today, true), description: text('', true), visit: text(), careCase: text(), notes: text() });
  readonly paymentForm = new FormGroup({ charge: text('', true), amount: text('', true), date: text(this.today, true), method: text('Cash', true, 100), reference: text('', false, 200), notes: text() });
  readonly reason = text('', true);
  readonly planForm = new FormGroup({ charge: text('', true), firstDate: text(this.today, true), count: new FormControl(3, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(120)] }), reason: text(), items: new FormArray<FormGroup<{ dueDate: FormControl<string>; amount: FormControl<string> }>>([]) });
  constructor() {
    this.chargeForm.controls.clinic.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.chargeForm.controls.visit.setValue(''); this.chargeForm.controls.careCase.setValue('');
    });
  }
  get canWrite() { return !this.self && ['admin', 'super-admin'].includes(this.auth.currentUserValue?.role ?? ''); }
  ngOnChanges() {
    if (!this.patient && !this.self) return;
    this.mode = ''; this.load();
    if (this.canWrite) this.clinicsApi.getAccessible().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: clinics => {
      this.clinics = clinics.filter(c => c._id && (!this.clinic || c._id === this.clinic)).map(c => ({ _id: c._id ?? '', name: c.name }));
      this.chargeForm.controls.clinic.setValue(this.clinic || (this.clinics.length === 1 ? this.clinics[0]._id : ''));
    }, error: error => this.error = careError(error) });
  }
  load() {
    const version = ++this.requestVersion; this.loading = true; this.error = '';
    this.api.record(this.patient, this.clinic || undefined, this.self).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ledger => { if (version === this.requestVersion) { this.ledger = ledger; this.loading = false; } },
      error: error => { if (version === this.requestVersion) { this.ledger = null; this.error = careError(error); this.loading = false; } },
    });
  }
  open(mode: typeof this.mode, entry?: LedgerEntry) {
    if (this.saving) return; this.error = ''; this.success = ''; this.mode = mode;
    if (mode === 'payment' && entry) this.paymentForm.controls.charge.setValue(entry._id);
    if (mode === 'void') { this.selectedEntry = entry ?? null; this.reason.reset(''); }
    if (mode === 'plan' && entry) {
      this.planForm.controls.charge.setValue(entry._id); this.selectedPlan = this.ledger?.plans.find(p => p.charge === entry._id) ?? null;
      this.planForm.controls.items.clear(); this.planForm.controls.reason.reset('');
      if (this.selectedPlan) this.selectedPlan.items.forEach(item => this.addItem(item.dueDate, item.amount));
      else this.generate();
    }
  }
  close() { if (!this.saving) this.mode = ''; }
  newEntry() {
    if (this.saving) return;
    this.chargeOperation = uuid(); this.paymentOperation = uuid();
    this.chargeForm.reset({ clinic: this.clinic || (this.clinics.length === 1 ? this.clinics[0]._id : ''), date: this.today });
    this.paymentForm.reset({ date: this.today, method: 'Cash' }); this.error = ''; this.mode = '';
  }
  private submit(request: Observable<unknown>, after?: () => void) {
    this.saving = true; this.error = ''; this.success = '';
    request.pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { after?.(); this.mode = ''; this.success = 'Ledger saved.'; this.load(); }, error: error => this.error = careError(error),
    });
  }
  saveCharge() {
    if (!this.canWrite || this.saving || this.chargeForm.invalid) { this.chargeForm.markAllAsTouched(); return; }
    const v = this.chargeForm.getRawValue(), amount = parsePesos(v.amount);
    if (!amount) { this.error = 'Enter a positive peso amount with up to two decimals.'; return; }
    this.submit(this.api.charge({ patient: this.patient, clinic: v.clinic, amount, date: v.date, description: v.description, notes: v.notes,
      ...(v.visit ? { visit: v.visit } : {}), ...(v.careCase ? { careCase: v.careCase } : {}), operationId: this.chargeOperation }), () => this.newEntryAfterSave());
  }
  private newEntryAfterSave() { this.chargeOperation = uuid(); this.paymentOperation = uuid(); this.chargeForm.reset({ clinic: this.chargeForm.controls.clinic.value, date: this.today }); this.paymentForm.reset({ date: this.today, method: 'Cash' }); }
  savePayment() {
    if (!this.canWrite || this.saving || this.paymentForm.invalid) { this.paymentForm.markAllAsTouched(); return; }
    const v = this.paymentForm.getRawValue(), amount = parsePesos(v.amount);
    if (!amount) { this.error = 'Enter a positive peso amount with up to two decimals.'; return; }
    this.submit(this.api.payment({ ...v, amount, operationId: this.paymentOperation }), () => this.newEntryAfterSave());
  }
  voidEntry() {
    if (!this.canWrite || !this.selectedEntry || this.saving || this.reason.invalid) { this.reason.markAsTouched(); return; }
    this.submit(this.api.void(this.selectedEntry._id, this.reason.value));
  }
  addItem(date = this.today, amount?: number) { this.planForm.controls.items.push(new FormGroup({ dueDate: text(date, true), amount: text(amount ? formatPesos(amount).replace(/[₱,]/g, '') : '', true) })); }
  generate() {
    const charge = this.ledger?.charges.find(c => c._id === this.planForm.controls.charge.value);
    if (!charge) return;
    try { const items = monthlyInstallments(charge.amount, this.planForm.controls.count.value, this.planForm.controls.firstDate.value);
      this.planForm.controls.items.clear(); items.forEach(item => this.addItem(item.dueDate, item.amount)); this.error = '';
    } catch (error) { this.error = error instanceof Error ? error.message : 'Check the installment schedule.'; }
  }
  savePlan() {
    if (!this.canWrite || this.saving || this.planForm.invalid) { this.planForm.markAllAsTouched(); return; }
    const v = this.planForm.getRawValue(), items = v.items.map(item => ({ dueDate: item.dueDate, amount: parsePesos(item.amount) ?? 0 }));
    if (!items.length || items.some(item => !item.amount)) { this.error = 'Enter a positive amount for every installment.'; return; }
    if (this.selectedPlan && !v.reason.trim()) { this.error = 'Enter a reason for revising the schedule.'; return; }
    this.submit(this.selectedPlan ? this.api.revise(this.selectedPlan._id, this.selectedPlan.revision, items, v.reason) : this.api.installments(v.charge, items));
  }
}
