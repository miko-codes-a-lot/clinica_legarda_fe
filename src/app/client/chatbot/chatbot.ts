import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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
  @ViewChild('chatMessages') private chatMessages!: ElementRef;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
    } catch (err) {}
  }

  dialogueTree: { [key: string]: DialogNode } = {
    start: {
      text: 'Hi there! Welcome to our dental portal. What can I help you with today?',
      options: [
        { id: uuidv4(), text: 'Book an Appointment', nextNode: 'appointment_start' },
        { id: uuidv4(), text: 'I have a toothache', nextNode: 'toothache_tips' },
        { id: uuidv4(), text: 'How do I prevent cavities?', nextNode: 'cavity_prevention_tips' },
        { id: uuidv4(), text: 'When should my child have their first dental visit?', nextNode: 'child_first_visit' },
        { id: uuidv4(), text: 'What are my options for straightening my teeth?', nextNode: 'teeth_straightening_options' },
        { id: uuidv4(), text: 'What is a root canal?', nextNode: 'root_canal_info' },
        { id: uuidv4(), text: 'See all FAQ topics', nextNode: 'faq_list' }
      ]
    },
    appointment_start: {
      text: `Sure! Please provide your preferred date and time, or <a href="/app/appointment">click here</a> to schedule online`,
      options: [
        { id: uuidv4(), text: 'Go back', nextNode: 'start' }
      ]
    },
    toothache_tips: {
      text: 'You may rinse your mouth with warm salt water, use dental floss to remove any food stuck between your teeth, and take over-the-counter pain relievers if needed. Avoid very hot, cold, or sweet foods. If the pain persists more than a day or worsens, please schedule a dental appointment for proper treatment.',
      options: [
        { id: uuidv4(), text: 'Book an Appointment', nextNode: 'appointment_start' },
        { id: uuidv4(), text: 'Go back', nextNode: 'start' }
      ]
    },
    cavity_prevention_tips: {
      text: 'To prevent cavities, brush your teeth twice daily with fluoride toothpaste, floss once a day, avoid too much sugar, and visit your dentist regularly.',
      options: [
        { id: uuidv4(), text: 'Go back', nextNode: 'start' }
      ]
    },
    child_first_visit: {
      text: 'Children should have their first dental visit by their first birthday or when their first tooth appears. To prepare them, talk positively about the dentist, avoid using words like “pain” or “injection,” and bring their favorite toy for comfort.',
      options: [
        { id: uuidv4(), text: 'Go back', nextNode: 'start' }
      ]
    },
    teeth_straightening_options: {
      text: 'We offer several options for straightening teeth, including traditional braces and clear aligners. We can help you determine the best option for your needs and lifestyle during a consultation.',
      options: [
        { id: uuidv4(), text: 'Book a consultation', nextNode: 'appointment_start' },
        { id: uuidv4(), text: 'Go back', nextNode: 'start' }
      ]
    },
    root_canal_info: {
      text: 'A root canal is a procedure to remove infected tissue from the inside of a tooth to save it from extraction. The procedure is performed under local anesthesia, so it is no more painful than getting a filling.',
      options: [
        { id: uuidv4(), text: 'Go back', nextNode: 'start' }
      ]
    },
    faq_list: {
      text: 'What would you like to know more about?',
      options: [
        { id: uuidv4(), text: 'Toothache', nextNode: 'answer_toothache' },
        { id: uuidv4(), text: 'Cavities', nextNode: 'answer_cavity' },
        { id: uuidv4(), text: 'Dental Fillings', nextNode: 'answer_fillings' },
        { id: uuidv4(), text: 'Teeth Cleaning', nextNode: 'answer_cleaning' },
        { id: uuidv4(), text: 'Orthodontics (Braces/Aligners)', nextNode: 'answer_braces' },
        { id: uuidv4(), text: 'Wisdom Teeth', nextNode: 'answer_wisdom_teeth' },
        { id: uuidv4(), text: 'Teeth Whitening', nextNode: 'answer_whitening' },
        { id: uuidv4(), text: 'Child Dental Care', nextNode: 'answer_child_care' },
        { id: uuidv4(), text: 'Emergency Situations', nextNode: 'answer_emergency' },
        { id: uuidv4(), text: 'Root Canal vs. Filling vs. Crown', nextNode: 'answer_procedure_diff' },
        { id: uuidv4(), text: 'Go back to main menu', nextNode: 'start' }
      ]
    },
    answer_toothache: {
      text: 'If your tooth hurts only when you eat sweets or cold food, it may be a sign of a cavity or tooth sensitivity. If you have a general toothache, you can rinse with warm salt water and take an over-the-counter pain reliever. If the pain persists, please schedule an appointment.',
      options: [
        { id: uuidv4(), text: 'Book an Appointment', nextNode: 'appointment_start' },
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' }
      ]
    },
    answer_cavity: {
      text: 'Common signs of a cavity include tooth sensitivity, pain when eating, visible holes, or dark spots on your teeth. A dentist can confirm this with an examination and X-ray.',
      options: [
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' }
      ]
    },
    answer_fillings: {
      text: 'Dental fillings can last for many years, depending on the material and your oral hygiene. Regular check-ups help ensure they remain in good condition. If your crown or filling falls out, please contact us to schedule an appointment to have it re-cemented or replaced. In the meantime, you can use a temporary dental cement kit from a pharmacy to protect the tooth.',
      options: [
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' }
      ]
    },
    answer_cleaning: {
      text: 'It is recommended to have professional cleaning every 6 months to maintain healthy teeth and gums.',
      options: [
        { id: uuidv4(), text: 'Book an Appointment', nextNode: 'appointment_start' },
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' }
      ]
    },
    answer_braces: {
      text: 'We provide orthodontic treatments such as traditional braces and clear aligners. Children can be evaluated for braces as early as 7 years old, but treatment usually begins between ages 9–14. Book a consultation to see which option is best for you.',
      options: [
        { id: uuidv4(), text: 'Book a consultation', nextNode: 'appointment_start' },
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' }
      ]
    },
    answer_wisdom_teeth: {
      text: 'Not all wisdom teeth need to be removed. Extraction may be recommended if they cause pain, swelling, or crowding. The procedure is done with local anesthesia, so you should not feel pain during the extraction itself, though some discomfort afterward is normal. Our dentist can confirm after an X-ray.',
      options: [
        { id: uuidv4(), text: 'Book a consultation', nextNode: 'appointment_start' },
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' }
      ]
    },
    answer_whitening: {
      text: 'Yes, we offer professional teeth whitening that is safe and more effective than over-the-counter products. Some temporary sensitivity may occur, but it usually goes away in a few days. We will need to do a quick consultation to ensure your teeth and gums are healthy enough for the procedure.',
      options: [
        { id: uuidv4(), text: 'Book a consultation', nextNode: 'appointment_start' },
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' }
      ]
    },
    answer_child_care: {
      text: 'Children should have their first dental visit by their first birthday or when their first tooth appears. To prepare them, talk positively about the dentist, avoid using words like “pain” or “injection,” and bring their favorite toy for comfort.',
      options: [
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' }
      ]
    },
    answer_emergency: {
      text: 'If your tooth is knocked out, this is a dental emergency. Try to find the tooth, hold it by the crown, and rinse it gently. Try to place it back in the socket or keep it moist in milk or saliva. Call us immediately for an emergency visit. If a crown or filling falls out, please contact us for an appointment.',
      options: [
        { id: uuidv4(), text: 'Call for an emergency visit', nextNode: 'end_conversation' },
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' }
      ]
    },
    answer_procedure_diff: {
      text: 'A filling is used to repair a small cavity or hole in a tooth. A crown is a cap that covers and protects a tooth that has been severely damaged or has a large filling. A root canal is a procedure to remove infected tissue from the inside of a tooth to save it from extraction.',
      options: [
        { id: uuidv4(), text: 'Ask another question', nextNode: 'faq_list' }
      ]
    },
    end_conversation: {
      text: 'Thank you for contacting us. Have a great day!',
      options: [
        { id: uuidv4(), text: 'Start over', nextNode: 'start' }
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
