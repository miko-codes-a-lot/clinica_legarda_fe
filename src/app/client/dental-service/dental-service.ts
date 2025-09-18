import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dental-service',
  imports: [CommonModule, RouterModule],
  templateUrl: './dental-service.html',
  styleUrl: './dental-service.css'
})
export class DentalService {
  services = [
    {
      icon: 'medical_services',
      title: 'General Consultation',
      description: 'Comprehensive medical check-ups and personalized advice.'
    },
    {
      icon: 'science',
      title: 'Laboratory Tests',
      description: 'Accurate diagnostic testing to guide effective treatment.'
    },
    {
      icon: 'health_and_safety',
      title: 'Dental Care',
      description: 'From cleaning to orthodontics, we ensure a healthy smile.'
    },
    {
      icon: 'child_friendly',
      title: 'Pediatrics',
      description: 'Gentle and expert care tailored for children’s needs.'
    }
  ];
}
