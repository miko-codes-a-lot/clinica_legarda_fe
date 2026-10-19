import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DependentsApiService, PatientIdentity } from './dependents-api.service';
import { UserStatus } from '../../_shared/model/user';
@Component({ selector: 'app-patient-selector', template: `
  @if (self) { <section class="mb-5 rounded-xl border border-stroke p-4" aria-label="Patient selection">
    <label class="ui-label block">Patient<select class="ui-input mt-2 w-full" [value]="selected" (change)="selectFromEvent($event)" [disabled]="disabled || loading">
      <option [value]="self._id">{{ name(self) }} (myself)</option>
      @for (child of children; track child._id) { <option [value]="child._id">{{ name(child) }} (child)</option> }
    </select></label>
    <div class="mt-2 flex flex-wrap items-center gap-3 text-sm"><p class="ui-muted">Child appointments and records stay under the child’s name.</p><button type="button" class="ui-button-ghost" [disabled]="loading || disabled" (click)="refresh()">Refresh patient list</button></div>
    @if (loading) { <p role="status" class="ui-muted">Loading children…</p> } @if (error) { <p role="alert" class="ui-alert-error">{{ error }}</p> }
  </section> }` })
export class PatientSelector implements OnChanges {
  private readonly api = inject(DependentsApiService); private readonly destroyRef = inject(DestroyRef);
  @Input() self: PatientIdentity | null = null; @Input() disabled = false;
  @Output() patientChange = new EventEmitter<PatientIdentity>();
  children: PatientIdentity[] = []; selected = ''; loading = false; error = ''; private version = 0; private owner = '';
  readonly name = (person: PatientIdentity) => [person.firstName, person.middleName, person.lastName].filter(Boolean).join(' ');
  ngOnChanges() { if (this.owner !== (this.self?._id ?? '')) { this.owner = this.self?._id ?? ''; this.selected = this.owner; this.children = []; this.loading = false; this.version++; this.refresh(); } }
  refresh() {
    const version = ++this.version;
    if (!this.self?._id || this.self.status !== UserStatus.CONFIRMED) return;
    this.loading = true; this.error = '';
    this.api.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: children => {
      if (version !== this.version) return;
      this.children = children; this.loading = false;
      if (this.selected !== this.self?._id && !children.some(child => child._id === this.selected)) this.select(this.self?._id ?? '');
    }, error: () => { if (version !== this.version) return; this.children = []; this.loading = false; this.error = 'Could not load children. Refresh the patient list to try again.'; if (this.self && this.selected !== this.self._id) this.select(this.self._id); } });
  }
  selectFromEvent(event: Event) { if (event.target instanceof HTMLSelectElement) this.select(event.target.value); }
  select(id: string) {
    const person = [this.self, ...this.children].find(person => person?._id === id);
    if (!person) return;
    this.selected = id; this.patientChange.emit(person);
  }
}
