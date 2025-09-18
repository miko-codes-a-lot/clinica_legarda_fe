import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
