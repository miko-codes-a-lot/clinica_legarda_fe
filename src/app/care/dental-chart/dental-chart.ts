import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DentalChartsApiService } from './dental-charts-api.service';
import { chartAuthorName, chartQuadrants, DentalChartRecord, DentalChartResponse, DentalChartRevision, Dentition, ToothObservation } from './dental-chart.models';
import { careError } from '../care-api.service';
@Component({ selector: 'app-dental-chart', imports: [FormsModule, DatePipe], templateUrl: './dental-chart.html', styleUrl: './dental-chart.css' })
export class DentalChart implements OnChanges {
  @Input() patientId = ''; @Input() clinic = ''; @Input() canWrite = false;
  private readonly api = inject(DentalChartsApiService); private readonly destroyRef = inject(DestroyRef); private version = 0;
  clinics: { _id: string; name: string }[] = []; selectedClinic = ''; dentition: Dentition = 'permanent';
  chart: DentalChartRecord | null = null; currentRevision = 0; history: DentalChartRevision[] = []; draft: ToothObservation[] = [];
  loading = false; saving = false; conflict = false; error = ''; message = ''; selectedTooth = 11; viewingRevision?: number; revisionToView = 1;
  readonly authorName = chartAuthorName;
  get quadrants() { return chartQuadrants(this.dentition); }
  get editable() { return this.canWrite && !this.conflict && this.viewingRevision === undefined && !this.loading && !this.saving && !!this.selectedClinic; }
  get dirty() { return JSON.stringify(this.draft) !== JSON.stringify(this.chart?.teeth ?? []); }
  get observation() { return this.draft.find(item => item.tooth === this.selectedTooth)?.observation ?? ''; }
  get notes() { return this.draft.find(item => item.tooth === this.selectedTooth)?.notes ?? ''; }
  ngOnChanges() {
    const version = ++this.version; this.clear(); this.loading = true;
    this.api.clinics().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: clinics => {
      if (version !== this.version) return;
      this.clinics = clinics; this.selectedClinic = this.clinic || (clinics.length === 1 ? clinics[0]._id : ''); this.loading = false;
      if (this.selectedClinic && clinics.some(clinic => clinic._id === this.selectedClinic)) this.load();
      else if (this.selectedClinic) { this.selectedClinic = ''; this.error = 'This clinic is outside your current chart access.'; }
    }, error: error => { if (version !== this.version) return; this.loading = false; this.error = careError(error); } });
  }
  private clear() { this.chart = null; this.history = []; this.draft = []; this.currentRevision = 0; this.error = ''; this.message = ''; this.saving = false; this.conflict = false; }
  changeClinic(clinic: string) { this.selectedClinic = clinic; this.load(); }
  changeDentition(dentition: Dentition) { this.dentition = dentition; this.selectedTooth = dentition === 'primary' ? 51 : 11; this.load(); }
  load(revision?: number) {
    const version = ++this.version; this.clear(); this.viewingRevision = revision;
    if (!this.patientId || !this.selectedClinic) { this.loading = false; return; }
    this.loading = true;
    this.api.read(this.patientId, this.selectedClinic, this.dentition, revision).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: response => { if (version !== this.version) return; this.apply(response); this.loading = false; }, error: error => { if (version !== this.version) return; this.error = careError(error); this.loading = false; } });
  }
  private apply(response: DentalChartResponse) { this.chart = response.chart; this.currentRevision = response.currentRevision; this.history = response.history; this.draft = (response.chart?.teeth ?? []).map(item => ({ ...item })); this.revisionToView = response.chart?.revision ?? 1; }
  recorded(tooth: number) { return this.draft.some(item => item.tooth === tooth && !!item.observation.trim()); }
  selectTooth(tooth: number) { this.selectedTooth = tooth; }
  setObservation(value: string) { this.updateTooth({ observation: value }); }
  setNotes(value: string) { this.updateTooth({ notes: value }); }
  private updateTooth(value: Partial<Pick<ToothObservation,'observation' | 'notes'>>) {
    if (!this.editable) return;
    const current = this.draft.find(item => item.tooth === this.selectedTooth) ?? { tooth: this.selectedTooth, observation: '', notes: '' };
    const updated = { ...current, ...value };
    this.draft = [...this.draft.filter(item => item.tooth !== this.selectedTooth), ...(updated.observation || updated.notes ? [updated] : [])].sort((a,b) => a.tooth-b.tooth);
  }
  save() {
    if (!this.editable || !this.dirty) return;
    const teeth = this.draft.map(item => ({ tooth: item.tooth, observation: item.observation.trim(), notes: item.notes.trim() })).filter(item => item.observation || item.notes);
    if (teeth.some(item => !item.observation)) { this.error = 'Enter an observation for each recorded tooth, or clear both fields to remove its entry.'; return; }
    const version = this.version; this.saving = true; this.error = ''; this.message = '';
    this.api.save(this.patientId, { clinic: this.selectedClinic, dentition: this.dentition, expectedRevision: this.currentRevision, teeth }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: response => { if (version !== this.version) return; this.apply(response); this.saving = false; this.message = 'Dental chart saved. The earlier revision is retained.'; }, error: error => { if (version !== this.version) return; this.saving = false; this.conflict = error instanceof HttpErrorResponse && error.status === 409; this.error = careError(error); } });
  }
}
