import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { Chatbot } from './chatbot';

describe('Chatbot', () => {
  let component: Chatbot;
  let fixture: ComponentFixture<Chatbot>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Chatbot],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Chatbot);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function reply(text: string): HTMLElement {
    component.userInput = 'How do I contact the clinic?';
    component.sendMessage();
    http.expectOne('/chatbot/message').flush({ reply: text });
    fixture.detectChanges();
    const messages = fixture.nativeElement.querySelectorAll('.bot-bubble');
    return messages[messages.length - 1];
  }

  it('keeps reply text plain while preserving line breaks', () => {
    const bubble = reply('**Phone:** 0917 123 4567\n**Email:** clinic@example.test');
    expect(bubble.textContent).toBe('**Phone:** 0917 123 4567**Email:** clinic@example.test');
    expect(bubble.querySelector('strong')).toBeNull();
    expect(bubble.querySelectorAll('br').length).toBe(1);
  });

  it('keeps untrusted HTML inert inside plain replies', () => {
    const bubble = reply('**<img src=x onerror=alert(1)>** & <script>alert(1)</script>');
    expect(bubble.querySelector('img, script')).toBeNull();
    expect(bubble.querySelector('strong')).toBeNull();
    expect(bubble.textContent).toContain('**<img src=x onerror=alert(1)>**');
    expect(bubble.textContent).toContain('& <script>alert(1)</script>');
  });

  it('retains allowed internal links and does not create links for unsafe destinations', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    const bubble = reply('**[Book](/app/appointment)** [unsafe](javascript:alert) [outside](https://example.test) [injected](/app/contact-us\"onclick=alert)');
    const links = bubble.querySelectorAll('a');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toBe('/app/appointment');
    links[0].addEventListener('click', event => event.preventDefault());
    links[0].click();
    expect(navigate).toHaveBeenCalledOnceWith('/app/appointment');
    expect(bubble.textContent).toBe('**Book** unsafe outside injected');
  });

  it('navigates both booking and contact links and closes the chat', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    const closed = spyOn(component.chatClosed, 'emit');
    const bubble = reply('You can [book an appointment](/app/appointment), or [contact the clinic](/app/contact-us).');
    const links = bubble.querySelectorAll('a');
    expect(links.length).toBe(2);
    links.forEach(link => {
      link.addEventListener('click', event => event.preventDefault());
      link.click();
    });
    expect(navigate.calls.allArgs()).toEqual([['/app/appointment'], ['/app/contact-us']]);
    expect(closed).toHaveBeenCalledTimes(2);
  });

  it('sends original reply content in history without generated HTML', () => {
    reply('**Phone:** 0917 123 4567\n[Book](/app/appointment)');
    component.userInput = 'Thank you';
    component.sendMessage();
    const request = http.expectOne('/chatbot/message');
    expect(request.request.body.history.at(-1)).toEqual({ role: 'assistant', content: '**Phone:** 0917 123 4567\n[Book](/app/appointment)' });
    request.flush({ reply: 'You are welcome.' });
  });
});
