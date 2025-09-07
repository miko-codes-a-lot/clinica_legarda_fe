import { Component } from '@angular/core';
import { Chatbot } from '../chatbot/chatbot';

@Component({
  selector: 'app-home',
  imports: [Chatbot],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  isChatOpen: boolean = false
}
