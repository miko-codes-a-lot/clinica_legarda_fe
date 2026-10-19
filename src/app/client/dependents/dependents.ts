import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DependentsApiService, PatientIdentity } from './dependents-api.service';
import { birthDateValidator } from '../../_shared/model/patient-demographics';
import { careError } from '../../care/care-api.service';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
@Component({ selector: 'app-dependents', imports: [ReactiveFormsModule, RouterLink, PageHeader], templateUrl: './dependents.html' })
export class DependentsPage implements OnInit {
  private readonly api = inject(DependentsApiService); private readonly destroyRef = inject(DestroyRef); private readonly fb = inject(FormBuilder);
  children: PatientIdentity[] = []; loading = false; saving = false; error = ''; message = ''; editing = ''; removing = '';
  readonly form = this.fb.nonNullable.group({ firstName: ['', [Validators.required, Validators.maxLength(100)]], middleName: ['', Validators.maxLength(100)], lastName: ['', [Validators.required, Validators.maxLength(100)]], birthDate: ['', [Validators.required, birthDateValidator()]], sex: ['', Validators.maxLength(100)] });
  ngOnInit() { this.load(); }
  load() { this.loading = true; this.error = ''; this.api.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: rows => { this.children = rows; this.loading = false; }, error: error => { this.children = []; this.loading = false; this.error = careError(error); } }); }
  edit(child: PatientIdentity) { this.editing = child._id; this.form.reset({ firstName: child.firstName, middleName: child.middleName ?? '', lastName: child.lastName, birthDate: child.birthDate ?? '', sex: child.sex ?? '' }); }
  reset() { this.editing = ''; this.form.reset(); }
  save() {
    if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue(); const payload = { ...value, firstName: value.firstName.trim(), middleName: value.middleName.trim(), lastName: value.lastName.trim(), sex: value.sex.trim() };
    this.saving = true; this.error = ''; this.message = '';
    const request = this.editing ? this.api.update(this.editing, payload) : this.api.create(payload);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => { this.saving = false; this.message = this.editing ? 'Child details updated.' : 'Child added. You can now select them when booking.'; this.reset(); this.load(); }, error: error => { this.saving = false; this.error = careError(error); } });
  }
  unlink(child: PatientIdentity) {
    if (this.saving) return; this.saving = true; this.error = '';
    this.api.unlink(child._id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: result => { this.saving = false; this.removing = ''; this.message = result.message; this.load(); }, error: error => { this.saving = false; this.error = careError(error); } });
  }
}
