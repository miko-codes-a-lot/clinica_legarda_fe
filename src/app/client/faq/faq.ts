import { Icon } from '../../_shared/ui/icon/icon';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../_shared/ui/page-header/page-header';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  imports: [Icon, PageHeader, CommonModule, RouterLink],
  templateUrl: './faq.html',
  styleUrl: './faq.css'
})
export class Faq {
  faqs = [
    {
      question: 'What services does Clinica Legarda offer?',
      answer:
        'Sign in to your patient account to view available dental services and appointment durations. Contact your preferred branch for help choosing your care.',
      open: false
    },
    {
      question: 'How can I book an appointment?',
      answer:
        'You can book online through our Appointment page. Sign in to your patient account to choose your appointment details.',
      open: false
    },
    {
      question: 'Do you accept walk-ins?',
      answer:
        'Please contact your preferred clinic branch to ask about walk-in availability and its current schedule.',
      open: false
    },
    {
      question: 'Where is Clinica Legarda located?',
      answer:
        'Visit our Contact Us page for current branch addresses, contact information and opening hours.',
      open: false
    }
  ];

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
