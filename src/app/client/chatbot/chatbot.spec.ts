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

  it('renders Markdown contact labels as emphasis without visible asterisks', () => {
    const bubble = reply('**Phone:** 0917 123 4567\n**Email:** clinic@example.test');
    expect(bubble.textContent).toBe('Phone: 0917 123 4567Email: clinic@example.test');
    expect(Array.from(bubble.querySelectorAll('strong'), node => node.textContent)).toEqual(['Phone:', 'Email:']);
    expect(bubble.querySelectorAll('br').length).toBe(1);
  });

  it('keeps untrusted HTML inert inside emphasized replies', () => {
    const bubble = reply('**<img src=x onerror=alert(1)>** & <script>alert(1)</script>');
    expect(bubble.querySelector('img, script')).toBeNull();
    expect(bubble.querySelector('strong')?.textContent).toBe('<img src=x onerror=alert(1)>');
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
    expect(bubble.textContent).toBe('Book unsafe outside injected');
  });

  it('sends original reply content in history without generated HTML', () => {
    reply('**Phone:** 0917 123 4567');
    component.userInput = 'Thank you';
    component.sendMessage();
    const request = http.expectOne('/chatbot/message');
    expect(request.request.body.history.at(-1)).toEqual({ role: 'assistant', content: '**Phone:** 0917 123 4567' });
    request.flush({ reply: 'You are welcome.' });
  });
});
