import { assignedClinicIds } from '../../_shared/model/user';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { DentistAvailabilityApi, DentistDayAvailability, AvailabilityAffected, AvailabilityPayload, DentistAvailabilityInterval } from '../../_shared/service/dentist-availability-api';
import { AuthService } from '../../_shared/service/auth-service';
import { ClinicService } from '../../_shared/service/clinic-service';
import { AppointmentService } from '../../_shared/service/appointment-service';
import { UserSimple } from '../../_shared/model/user-simple';
import { Clinic } from '../../_shared/model/clinic';
import { Appointment } from '../../_shared/model/appointment';
import { pickerDateKey, storedDateKey, minutesTime, timeMinutes } from '../../_shared/model/booking-availability';
import { clinicToday } from '../../care/care.models';
import { careError } from '../../care/care-api.service';
import { PageHeader } from '../../_shared/ui/page-header/page-header';

@Component({ selector: 'app-dentist-availability', imports: [CommonModule, FormsModule, MatDatepickerModule, MatNativeDateModule, RouterLink, PageHeader],
  templateUrl: './dentist-availability.html', styleUrl: './dentist-availability.css' })
export class DentistAvailability implements OnInit {
  private readonly destroyRef = inject(DestroyRef); private readonly api = inject(DentistAvailabilityApi);
  private readonly auth = inject(AuthService); private readonly clinicsApi = inject(ClinicService); private readonly appointmentsApi = inject(AppointmentService);
  user: UserSimple | null = null; clinics: Clinic[] = []; clinicId = ''; days: DentistDayAvailability[] = []; appointments: Appointment[] = [];
  readonly minDate = new Date(`${clinicToday()}T00:00:00`); readonly maxDate = new Date(this.minDate.getTime() + 365 * 86400000);
  selectedDate = new Date(this.minDate); intervals: DentistAvailabilityInterval[] = []; revision = 0; restoreWeekly = false;
  previewRows: AvailabilityAffected[] = []; previewed = false; loading = false; saving = false; error = ''; success = '';
  private version = 0; private editVersion = 0;
  ngOnInit() {
    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      this.user = user; const version = ++this.version; this.days = []; this.appointments = []; this.clinics = []; this.clinicId = ''; this.loading = false; this.invalidate();
      if (!user) return;
      this.clinicsApi.getAccessible().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: clinics => {
        if (version !== this.version || this.user?._id !== user._id) return;
        const assigned = assignedClinicIds(user);
        this.clinics = clinics.filter(clinic => !!clinic._id && assigned.includes(clinic._id));
        this.clinicId = this.clinics[0]?._id ?? ''; this.load();
      }, error: error => { if (version === this.version) this.error = careError(error); } });
    });
  }
  load() {
    if (!this.user || !this.clinicId) return;
    const version = ++this.version; this.loading = true; this.error = ''; this.invalidate();
    forkJoin({ days: this.api.list(this.user._id, this.clinicId, pickerDateKey(this.minDate), pickerDateKey(this.maxDate)), appointments: this.appointmentsApi.getAllByDentist(this.user._id) })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: result => {
        if (version !== this.version) return;
        this.days = result.days; this.appointments = result.appointments; this.loading = false; this.selectDate(this.selectedDate);
      }, error: error => { if (version === this.version) { this.loading = false; this.days = []; this.appointments = []; this.error = careError(error); } } });
  }
  selectDate(date: Date | null) {
    if (!date || this.saving) return;
    this.selectedDate = new Date(date); this.invalidate();
    const row = this.days.find(day => day.date === pickerDateKey(date)); this.revision = row?.revision ?? 0;
    this.restoreWeekly = !!row?.useWeeklyHours;
    this.intervals = row && !row.useWeeklyHours ? row.intervals.map(interval => ({ ...interval })) : this.weeklyIntervals();
  }
  private weeklyIntervals(): DentistAvailabilityInterval[] {
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][this.selectedDate.getDay()];
    const clinic = this.clinics.find(row => row._id === this.clinicId);
    return (this.user?.operatingHours ?? []).filter(row => row.day === day).flatMap(row => {
      if (clinic?.appointmentOnlyDays?.includes(day)) return [{ startTime: row.startTime, endTime: row.endTime }];
      return (clinic?.operatingHours ?? []).filter(hour => hour.day === day).flatMap(hour => {
        const start = Math.max(timeMinutes(row.startTime), timeMinutes(hour.startTime)), end = Math.min(timeMinutes(row.endTime), timeMinutes(hour.endTime));
        return start < end ? [{ startTime: minutesTime(start), endTime: minutesTime(end) }] : [];
      });
    });
  }
  invalidate() { this.editVersion++; this.previewed = false; this.previewRows = []; }
  edit() { this.restoreWeekly = false; this.invalidate(); }
  addInterval() { this.intervals.push({ startTime: '13:00', endTime: '17:00' }); this.edit(); }
  removeInterval(index: number) { this.intervals.splice(index, 1); this.edit(); }
  wholeDayOff() { this.intervals = []; this.edit(); }
  restore() { this.restoreWeekly = true; this.intervals = this.weeklyIntervals(); this.invalidate(); }
  private payload(): AvailabilityPayload { return { clinic: this.clinicId, intervals: this.intervals, expectedRevision: this.revision, restoreWeeklyHours: this.restoreWeekly }; }
  preview() {
    if (this.loading || this.saving || !this.user || !this.clinicId) return;
    const version = this.editVersion; this.saving = true; this.error = '';
    this.api.preview(this.user._id, pickerDateKey(this.selectedDate), this.payload()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.saving = false; if (version === this.editVersion) { this.previewRows = result.appointments; this.previewed = true; } },
      error: error => { this.saving = false; this.previewed = false; this.error = careError(error); },
    });
  }
  save() {
    if (!this.previewed || this.saving || !this.user) return;
    this.saving = true; this.error = '';
    this.api.save(this.user._id, pickerDateKey(this.selectedDate), { ...this.payload(), acknowledgedAppointmentIds: this.previewRows.map(row => row._id) })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => {
        this.saving = false; this.success = 'Availability saved. Affected bookings are flagged for clinic review.'; this.load();
      }, error: error => { this.saving = false; this.invalidate(); this.error = careError(error); } });
  }
  get dayAppointments() { return this.appointments.filter(row => row.clinic?._id === this.clinicId && storedDateKey(row.date) === pickerDateKey(this.selectedDate)); }
  readonly dateClass = (date: Date) => {
    const row = this.days.find(day => day.date === pickerDateKey(date) && !day.useWeeklyHours);
    return row ? row.intervals.length ? 'availability-day-custom' : 'availability-day-closed' : '';
  };
}
