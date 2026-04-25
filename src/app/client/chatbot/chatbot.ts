import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import {
  ChatbotService,
  ChatTurn,
} from '../../_shared/service/chatbot-service';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  raw: string;
}

const GREETING =
  "Hi! I'm the Clinica Legarda Dental Assistant. Ask me anything about dental care, or I can help you book an appointment.";

const HISTORY_LIMIT = 20;
const MESSAGE_LIMIT = 200;
const SCROLL_STICKY_PX = 80;

const ALLOWED_INTERNAL_ROUTES = new Set<string>([
  '/app/appointment',
  '/app/contact-us',
]);

@Component({
  selector: 'app-chatbot',
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot implements AfterViewChecked {
  @Output() chatClosed = new EventEmitter<void>();
  @ViewChild('chatMessages') private chatMessages!: ElementRef<HTMLElement>;

  messages: ChatMessage[] = [];
  userInput = '';
  isSending = false;

  private shouldStickToBottom = true;
  private lastScrolledLength = 0;

  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly router: Router,
  ) {}

  onMessagesClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a[data-route]') as HTMLAnchorElement | null;
    if (!anchor) return;

    const route = anchor.getAttribute('data-route') ?? '';
    if (!this.isSafeInternalRoute(route)) return;

    event.preventDefault();
    this.router.navigateByUrl(route);
    this.closeChat();
  }

  onMessagesScroll(): void {
    const el = this.chatMessages?.nativeElement;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    this.shouldStickToBottom = distanceFromBottom <= SCROLL_STICKY_PX;
  }

  ngOnInit(): void {
    this.pushMessage('bot', GREETING);
  }

  ngAfterViewChecked(): void {
    if (this.messages.length === this.lastScrolledLength) return;
    this.lastScrolledLength = this.messages.length;
    if (this.shouldStickToBottom) this.scrollToBottom();
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isSending) return;

    this.pushMessage('user', text);
    this.userInput = '';
    this.isSending = true;
    this.shouldStickToBottom = true;

    const history: ChatTurn[] = this.messages
      .slice(0, -1)
      .slice(-HISTORY_LIMIT)
      .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.raw,
      }));

    this.chatbotService.sendMessage(history, text).subscribe({
      next: ({ reply }) => {
        this.pushMessage('bot', reply || "Sorry, I didn't catch that. Could you rephrase?");
        this.isSending = false;
      },
      error: () => {
        this.pushMessage(
          'bot',
          'Sorry, I had trouble responding. Please try again.',
        );
        this.isSending = false;
      },
    });
  }

  closeChat(): void {
    this.chatClosed.emit();
  }

  private pushMessage(sender: 'bot' | 'user', raw: string): void {
    const text = sender === 'bot' ? this.formatReply(raw) : raw;
    this.messages.push({ id: uuidv4(), sender, text, raw });
    if (this.messages.length > MESSAGE_LIMIT) {
      this.messages.splice(0, this.messages.length - MESSAGE_LIMIT);
    }
  }

  private isSafeInternalRoute(route: string): boolean {
    return (
      route.startsWith('/') &&
      !route.startsWith('//') &&
      ALLOWED_INTERNAL_ROUTES.has(route)
    );
  }

  private formatReply(text: string): string {
    const normalized = text.replace(/ ?— ?/g, ', ');

    const escaped = normalized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const withMarkdownLinks = escaped.replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_match, label: string, url: string) => {
        if (this.isSafeInternalRoute(url)) {
          return `<a href="${url}" data-route="${url}" class="chat-link">${label}</a>`;
        }
        return label;
      },
    );

    return withMarkdownLinks.replace(/\n/g, '<br>');
  }

  private scrollToBottom(): void {
    try {
      const el = this.chatMessages.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
