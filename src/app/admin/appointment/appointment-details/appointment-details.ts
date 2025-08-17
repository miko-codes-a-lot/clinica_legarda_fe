import { Component } from '@angular/core';
import { Appointment } from '../../../_shared/model/appointment';
import { AppointmentService } from '../../../_shared/service/appointment-service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-appointment-details',
  imports: [DatePipe],
  templateUrl: './appointment-details.html',
  styleUrl: './appointment-details.css'
})
export class AppointmentDetails {
  isLoading = false
  id!: string
  appointment?: Appointment

  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.isLoading = true

    this.id = this.route.snapshot.params['id']
    
    this.appointmentService.getOne(this.id).subscribe({
      next: (a) => this.appointment = a,
      error: (e) => alert(`Something went wrong ${e}`)
    }).add(() => this.isLoading = false)
  }

  onUpdate() {
    this.router.navigate(['/admin/appointment/update', this.id])
  }
}
