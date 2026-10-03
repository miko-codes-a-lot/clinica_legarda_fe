import { Icon } from '../../_shared/ui/icon/icon';
import { CLINIC_PROFILE } from '../../_shared/clinic-profile';
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
      question: `What services does ${CLINIC_PROFILE.fullName} offer?`,
      answer:
        'Our services include oral prophylaxis, tooth restoration (pasta), fluoride and sealants, extractions, braces and retainers, dentures, bridges and crowns, night guards, root canal treatment, post and core, whitening, periodontal treatment and odontectomy. See Services for the full overview.',
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
        'The clinic staff can register a walk-in patient and check them into the treatment queue. Contact the clinic for availability. Verify your account later if you want to book online yourself.',
      open: false
    },
    {
      question: `Where is ${CLINIC_PROFILE.fullName} located?`,
      answer:
        `${CLINIC_PROFILE.address}. Call ${CLINIC_PROFILE.phones.join(' or ')}. Our Contact Us page has opening hours and current branch details.`,
      open: false
    },
    {
      question: 'Which treatments need a consultation first?',
      answer: 'Braces, root canal treatment and surgery require a consultation or assessment before the treatment is scheduled. Braces, root canal treatment and denture trial fitting can need multiple sessions. Staff can link these visits to your treatment case.',
      open: false
    }
  ];

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
