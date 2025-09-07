import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string
  sender: 'bot' | 'user'
  text: string
}

export interface DialogueOption {
  id: string
  text: string
  nextNode: string
}

export interface DialogNode {
  text: string
  options?: DialogueOption[]
}

@Component({
  selector: 'app-chatbot',
  imports: [
    MatCardModule,
    MatButtonModule,
    CommonModule,
  ],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class Chatbot {
  @Output() chatClosed = new EventEmitter<void>()

  dialogueTree: { [key: string]: DialogNode } = {
    start: {
      text: 'Hi there! Welcome to our dental portal. Can I help you with some common questions?',
      options: [
        { id: uuidv4(), text: 'Yes, please!', nextNode: 'faq_list' },
        { id: uuidv4(), text: 'No, thank you!', nextNode: 'end_conversation' },
      ]
    },
    faq_list: {
      text: 'Great! What would you like to know?',
      options: [
        { id: uuidv4(), text: 'What are your clinic hours?', nextNode: 'answer_hours' },
        { id: uuidv4(), text: 'Do you accept my insurance?', nextNode: 'answer_insurance' },
        { id: uuidv4(), text: 'What services do you offer?', nextNode: 'answer_services' },
        { id: uuidv4(), text: 'Go back', nextNode:' start' },
      ]
    },
    answer_hours: {
      text: 'Our clinic is open Monday to Friday from 9 AM to 6 PM, and Saturdays from 10 AM to 4 PM. We are closed on Sundays.',
      options: [
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' },
        { id: uuidv4(), text: 'That is all, thanks!', nextNode: 'end_conversation' },
      ]
    },
    answer_insurance: {
      text: 'We accept a wide range of PRO insurance plans. For specific details about your provider, it is best to call our front desk at (555) 123-4567',
      options: [
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' },
        { id: uuidv4(), text: 'That is all, thanks!', nextNode: 'end_conversation' },
      ]
    },
    answer_services: {
      text: 'We offer a full range of services including cleanings, fillings, root canals, crown, implants, and cosmetic dentistry like teeth whitening.',
      options: [
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' },
        { id: uuidv4(), text: 'That is all, thanks!', nextNode: 'end_conversation' },
      ]
    },
    end_conversation: {
      text: 'Alright! If you change your mind or need anyhting else, we are here to help. Have a great day!',
      options: [
        { id: uuidv4(), text: 'Let us talk again', nextNode: 'start' }
      ]
    }
  }

  currentNodeKey: string = 'start'
  currentNode: DialogNode = this.dialogueTree[this.currentNodeKey]
  messages: ChatMessage[] = []

  ngOnInit(): void {
    const id = uuidv4()
    this.messages.push({ id, sender: 'bot', text: this.currentNode.text })
  }

  handleUserChoice(option: DialogueOption): void {
    const user_chat_id = uuidv4()
    this.messages.push({ id: user_chat_id, sender: 'user', text: option.text })

    this.currentNodeKey = option.nextNode
    this.currentNode = this.dialogueTree[this.currentNodeKey]

    setTimeout(() => {
      const id = uuidv4()
      this.messages.push({ id, sender: 'bot', text: this.currentNode.text })
    }, 500);
  }

  closeChat() {
    this.chatClosed.emit()
  }
}
