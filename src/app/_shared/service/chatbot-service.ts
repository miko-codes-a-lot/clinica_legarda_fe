import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatReply {
  reply: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  constructor(private http: HttpClient) {}

  sendMessage(history: ChatTurn[], message: string): Observable<ChatReply> {
    return this.http.post<ChatReply>('/chatbot/message', { history, message });
  }
}
