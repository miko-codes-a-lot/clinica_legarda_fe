import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClinicService } from '../../_shared/service/clinic-service';
import { Clinic } from '../../_shared/model/clinic';

@Component({
  selector: 'app-contact-us',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css'
})
export class ContactUs {
 isLoading = false;

  contact = {
    name: '',
    email: '',
    message: ''
  };

  constructor(
    private readonly clinicService: ClinicService,
  ) {}

  clinics: Clinic[] = []

  ngOnInit(): void {
    this.clinicService.getAll().subscribe({
      next: (clinics) => {
        this.clinics = clinics;
        console.log('this.clinics', this.clinics);
      },
      error: (e) => alert(`Something went wrong ${e}`)
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
      alert('Your message has been sent successfully!');
      this.contact = { name: '', email: '', message: '' };
      this.isLoading = false;
    }, 1000);
  }
}
