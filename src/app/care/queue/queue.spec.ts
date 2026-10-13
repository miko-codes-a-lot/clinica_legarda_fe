import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../_shared/service/auth-service';
import { CareVisit, clinicToday } from '../care.models';
import { TreatmentQueue } from './queue';

describe('Treatment queue cancellation through the rendered form', () => {
  let fixture: ComponentFixture<TreatmentQueue>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const visit = (state: 'waiting' | 'in_progress'): CareVisit => ({
    _id: 'visit-1', patient: { _id: 'patient-1', firstName: 'Ana', lastName: 'Rivera' },
    clinic: { _id: 'clinic-1', name: 'Care clinic' },
    dentist: { _id: 'dentist-1', firstName: 'Sofia', lastName: 'Lim' },
    date: clinicToday(), checkedInAt: '2026-10-13T01:00:00Z', state,
    purpose: 'consultation', isWalkIn: true, revision: 0,
    events: [{ state: 'waiting', actor: 'admin-1', at: '2026-10-13T01:00:00Z' }],
    assessment: '', treatments: [], summary: '', aftercare: '', nextSteps: '',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentQueue],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUserValue: { _id: 'admin-1', role: 'admin' } } }],
    }).compileComponents();
    spyOnProperty(TestBed.inject(Router), 'url', 'get').and.returnValue('/admin/care/queue');
    fixture = TestBed.createComponent(TreatmentQueue);
    http = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    http.expectOne('/clinics/accessible').flush([{ _id: 'clinic-1', name: 'Care clinic', address: '', mobileNumber: '', emailAddress: '', operatingHours: [], dentists: [] }]);
  });

  afterEach(() => http.verify());

  function loadQueue(row: CareVisit): void {
    const request = http.expectOne(req => req.url === '/care/queue');
    expect(request.request.params.get('date')).toBe(clinicToday());
    request.flush([row]);
    fixture.detectChanges();
  }

  function submitCancellation(): Event {
    const button = Array.from(element.querySelectorAll('button')).find(candidate => candidate.textContent?.trim() === 'Cancel visit');
    if (!button) throw new Error('The active visit has no cancellation action.');
    button.click();
    fixture.detectChanges();
    const textarea = element.querySelector('textarea');
    if (!textarea) throw new Error('The cancellation reason field did not open.');
    textarea.value = '  Patient had to leave  ';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    const form = textarea.closest('form');
    if (!form) throw new Error('The cancellation field has no form.');
    const submit = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submit);
    return submit;
  }

  for (const state of ['waiting', 'in_progress'] as const) {
    it(`submits a ${state} visit cancellation and moves the refreshed row into retained history`, () => {
      const row = visit(state);
      loadQueue(row);
      const submit = submitCancellation();
      expect(submit.defaultPrevented).withContext('The native form must not reload the queue.').toBeTrue();
      const mutation = http.expectOne('/care/visits/visit-1/state');
      expect(mutation.request.method).toBe('PATCH');
      expect(mutation.request.body).toEqual({ state: 'cancelled', reason: 'Patient had to leave' });
      const ended: CareVisit = { ...row, state: 'cancelled', endedAt: '2026-10-13T01:15:00Z', revision: 1,
        events: [...row.events, { state: 'cancelled', actor: 'admin-1', at: '2026-10-13T01:15:00Z', reason: 'Patient had to leave' }] };
      mutation.flush(ended);
      http.expectOne(req => req.url === '/care/queue').flush([ended]);
      fixture.detectChanges();
      expect(element.querySelector('textarea')).toBeNull();
      expect(element.querySelectorAll('article').length).toBe(0);
      expect(element.querySelector('[role="status"]')?.textContent).toContain('Visit cancelled. History retained.');
      expect(element.querySelector('app-generic-table')?.textContent).toContain('Ana Rivera');
      expect(element.querySelector('app-generic-table')?.textContent).toContain('Cancelled');
    });
  }

  it('keeps the cancellation form open with the entered reason when cancellation is rejected', () => {
    loadQueue(visit('waiting'));
    submitCancellation();
    http.expectOne('/care/visits/visit-1/state').flush({ message: 'The visit changed. Reload and try again.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(element.querySelector('textarea')?.value).toBe('  Patient had to leave  ');
    const retry = Array.from(element.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Confirm cancellation');
    expect(retry?.disabled).toBeFalse();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('The visit changed. Reload and try again.');
    http.expectNone(req => req.url === '/care/queue');
  });
});
