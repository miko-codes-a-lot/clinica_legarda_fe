import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of, startWith, Subject, switchMap } from 'rxjs';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { ClinicService } from '../../_shared/service/clinic-service';
import { AuthService } from '../../_shared/service/auth-service';
import { assignedClinicIds, isStaffBookablePatient } from '../../_shared/model/user';
import { CareApiService, careError } from '../care-api.service';
import { CareAppointment, CareClinic, CarePerson, TreatmentCase, clinicToday } from '../care.models';

@Component({ selector: 'app-patient-check-in', imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeader], templateUrl: './check-in.html' })
export class PatientCheckIn implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(CareApiService);
  private readonly clinicsApi = inject(ClinicService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly searches = new Subject<void>();
  readonly base = `/${this.router.url.split('/')[1]}/care`;
  readonly form = new FormGroup({
    patient: new FormControl('', { nonNullable: true, validators: Validators.required }),
    clinic: new FormControl('', { nonNullable: true, validators: Validators.required }),
    dentist: new FormControl('', { nonNullable: true, validators: Validators.required }),
    appointment: new FormControl('', { nonNullable: true }),
    careCase: new FormControl('', { nonNullable: true }),
    purpose: new FormControl<'consultation' | 'treatment'>(this.route.snapshot.queryParamMap.get('purpose') === 'treatment' ? 'treatment' : 'consultation', { nonNullable: true, validators: Validators.required }),
    isWalkIn: new FormControl(true, { nonNullable: true }),
  });
  readonly keyword = new FormControl(this.route.snapshot.queryParamMap.get('patient') ?? '', { nonNullable: true, validators: Validators.maxLength(100) });
  clinics: CareClinic[] = [];
  patients: CarePerson[] = [];
  dentists: CarePerson[] = [];
  appointments: CareAppointment[] = [];
  cases: TreatmentCase[] = [];
  loading = false;
  saving = false;
  error = '';
  searchError = '';
  readonly canRegister = ['admin', 'super-admin'].includes(this.auth.currentUserValue?.role ?? '');
  private initialPatient = this.route.snapshot.queryParamMap.get('patient');
  private initialAppointment = this.route.snapshot.queryParamMap.get('appointment');
  private initialCase = this.route.snapshot.queryParamMap.get('careCase');

  ngOnInit(): void {
    this.searches.pipe(switchMap(() => {
      const clinic = this.form.controls.clinic.value;
      if (!clinic) return of(null);
      this.loading = true; this.searchError = '';
      return forkJoin({ clinic: this.clinicsApi.getOne(clinic), patients: this.api.searchPatients({ search: this.keyword.value, clinic }) }).pipe(
        catchError(error => { this.searchError = careError(error); return of(null); }), finalize(() => this.loading = false),
      );
    }), takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (!result) { this.patients = []; this.dentists = []; return; }
      this.patients = result.patients.items.filter(patient => isStaffBookablePatient({ role: patient.role ?? '', status: patient.status }));
      const current = this.auth.currentUserValue;
      this.dentists = result.clinic.dentists.filter(dentist => dentist._id && (current?.role !== 'dentist' || dentist._id === current._id)).map(dentist => ({ ...dentist, _id: dentist._id ?? '' }));
      if (this.initialPatient && this.patients.some(patient => patient._id === this.initialPatient)) {
        this.form.controls.patient.setValue(this.initialPatient); this.initialPatient = null;
      } else if (!this.patients.some(patient => patient._id === this.form.controls.patient.value)) this.form.controls.patient.setValue('');
      const desiredDentist = this.route.snapshot.queryParamMap.get('dentist') ?? current?._id;
      if (!this.dentists.some(dentist => dentist._id === this.form.controls.dentist.value))
        this.form.controls.dentist.setValue(this.dentists.find(dentist => dentist._id === desiredDentist)?._id ?? (this.dentists.length === 1 ? this.dentists[0]._id : ''));
    });
    this.form.controls.clinic.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.form.controls.patient.setValue(''); this.form.controls.dentist.setValue(''); this.search();
    });
    this.form.controls.patient.valueChanges.pipe(startWith(''), switchMap(patient => {
      this.appointments = []; this.cases = []; this.form.controls.appointment.setValue(''); this.form.controls.careCase.setValue('');
      if (!patient) return of(null);
      return forkJoin({ record: this.api.patientRecord(patient, this.form.controls.clinic.value), cases: this.api.cases(patient, this.form.controls.clinic.value) }).pipe(catchError(error => { this.searchError = careError(error); return of(null); }));
    }), takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.appointments = result?.record.appointments.filter(appointment => appointment.status === 'confirmed' && appointment.date.slice(0, 10) === clinicToday()) ?? [];
      this.cases = result?.cases.filter(careCase => careCase.status === 'active') ?? [];
      if (this.initialCase && this.cases.some(careCase => careCase._id === this.initialCase)) {
        this.form.controls.careCase.setValue(this.initialCase); this.initialCase = null;
      }
      if (this.initialAppointment && this.appointments.some(appointment => appointment._id === this.initialAppointment)) {
        this.form.controls.appointment.setValue(this.initialAppointment); this.initialAppointment = null;
      }
    });
    this.form.controls.appointment.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      const appointment = this.appointments.find(item => item._id === id);
      this.form.controls.isWalkIn.setValue(appointment ? !!appointment.isWalkIn : true);
      if (appointment) { this.form.controls.dentist.setValue(appointment.dentist._id); this.form.controls.dentist.disable({ emitEvent: false }); }
      else this.form.controls.dentist.enable({ emitEvent: false });
      if (appointment?.careCase) { this.form.controls.careCase.setValue(appointment.careCase); this.form.controls.careCase.disable(); }
      else this.form.controls.careCase.enable();
    });
    this.form.controls.careCase.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      const careCase = this.cases.find(item => item._id === id);
      if (careCase) { this.form.controls.dentist.setValue(careCase.dentist._id); this.form.controls.purpose.setValue('treatment'); }
    });
    this.form.controls.dentist.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(id => {
      const careCase = this.cases.find(item => item._id === this.form.controls.careCase.value);
      if (careCase && careCase.dentist._id !== id) this.form.controls.careCase.setValue('');
    });
    this.clinicsApi.getAccessible().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: clinics => {
      const user = this.auth.currentUserValue;
      const assigned = user ? assignedClinicIds(user) : [];
      this.clinics = clinics.filter(clinic => clinic._id && (user?.role !== 'dentist' || assigned.includes(clinic._id))).map(clinic => ({ _id: clinic._id ?? '', name: clinic.name }));
      const initialClinic = this.route.snapshot.queryParamMap.get('clinic');
      this.form.controls.clinic.setValue(this.clinics.find(clinic => clinic._id === initialClinic)?._id ?? (this.clinics.length === 1 ? this.clinics[0]._id : ''));
    }, error: error => this.error = careError(error) });
  }
  search(): void { if (this.keyword.valid) this.searches.next(); }
  save(): void {
    if (this.form.invalid || this.saving || this.loading) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    this.saving = true; this.error = '';
    this.api.checkIn({ patient: value.patient, clinic: value.clinic, dentist: value.dentist, purpose: value.purpose,
      isWalkIn: value.appointment ? value.isWalkIn : true, ...(value.appointment ? { appointment: value.appointment } : {}), ...(value.careCase ? { careCase: value.careCase } : {}) })
      .pipe(finalize(() => this.saving = false), takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.router.navigate([this.base, 'queue']), error: error => this.error = careError(error),
      });
  }
}
