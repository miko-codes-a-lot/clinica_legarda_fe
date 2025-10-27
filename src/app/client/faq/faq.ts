import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  imports: [CommonModule],
  templateUrl: './faq.html',
  styleUrl: './faq.css'
})
export class Faq {
  faqs = [
    {
      question: 'What services does Clinica Legarda offer?',
      answer:
        // 'We provide general consultations, laboratory tests, dental care, and pediatrics. More services will be added soon!',
        'We provide general consultations, dental care, and pediatrics. More services will be added soon!',
      open: false
    },
    {
      question: 'How can I book an appointment?',
      answer:
        'You can book online through our Appointment page, or call us directly at (02) 123-4567.',
      open: false
    },
    {
      question: 'Do you accept walk-ins?',
      answer:
        'Yes, we accept walk-ins, but we recommend booking in advance to secure your preferred time slot.',
      open: false
    },
    {
      question: 'Where is Clinica Legarda located?',
      answer:
        'We are located at 123 Legarda Street, Manila, Philippines. Check our Contact Us page for a map and directions.',
      open: false
    }
  ];

  toggleFaq(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
