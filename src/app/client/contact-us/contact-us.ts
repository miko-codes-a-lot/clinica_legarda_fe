import { EmptyState } from '../../_shared/ui/empty-state/empty-state';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClinicService } from '../../_shared/service/clinic-service';
import { Clinic } from '../../_shared/model/clinic';
import { AlertService } from '../../_shared/service/alert.service';

@Component({
  selector: 'app-contact-us',
  imports: [PageHeader, EmptyState, CommonModule, FormsModule],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css'
})
export class ContactUs {
 isLoading = false;
 loadError = '';
 private readonly destroyRef = inject(DestroyRef);

  contact = {
    name: '',
    email: '',
    message: ''
  };

  constructor(
    private readonly clinicService: ClinicService,
    private readonly alertService: AlertService,

  ) {}

  clinics: Clinic[] = []

  ngOnInit(): void {
    this.loadClinics();
  }

  loadClinics(): void {
    this.isLoading = true;
    this.loadError = '';
    this.clinicService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (clinics) => {
        this.clinics = clinics;
      },
      error: () => { this.loadError = 'We could not load the branch details. Please try again.'; }
    }).add(() => this.isLoading = false);
  }

  formatTimeToAMPM(time24: string): string {
    if (!time24) return '';
    const [hourStr, minute] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }

  onSubmit() {
    if (this.isLoading) return;
    this.isLoading = true;

    setTimeout(() => {
      this.alertService.error('Your message has been sent successfully!');
      this.contact = { name: '', email: '', message: '' };
      this.isLoading = false;
    }, 1000);
  }
}
