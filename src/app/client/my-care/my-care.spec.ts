import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../_shared/service/auth-service';
import { MyCare } from './my-care';
import { MyCareRecord } from './my-care.models';

describe('Patient care print selection', () => {
  let fixture: ComponentFixture<MyCare>;
  let http: HttpTestingController;
  const clinic = { _id: 'clinic-one', name: 'First clinic', address: 'Manila' };
  const dentist = { _id: 'dentist-one', firstName: 'Mia', lastName: 'Cruz' };
  const record: MyCareRecord = {
    visits: [
      { _id: 'visit-one', clinic, dentist, date: '2026-10-01', purpose: 'consultation', summary: 'Selected published summary', aftercare: 'Brush gently', nextSteps: 'Return next week', treatments: [{ description: 'Examination', tooth: '12' }] },
      { _id: 'visit-two', clinic, dentist, date: '2026-10-02', purpose: 'treatment', summary: 'Other published summary', aftercare: '', nextSteps: '', treatments: [] },
      { _id: 'visit-three', clinic, dentist, date: '2026-10-03', purpose: 'treatment', careCase: 'case-one', summary: 'Linked treatment summary', aftercare: '', nextSteps: '', treatments: [] },
    ],
    cases: [
      { _id: 'case-one', clinic, dentist, title: 'Linked plan', plan: 'Published treatment plan', status: 'active', consultationVisit: 'visit-one' },
      { _id: 'case-two', clinic, dentist, title: 'Unrelated plan', plan: 'Other plan', status: 'active', consultationVisit: 'visit-two' },
    ],
    appointments: [{ _id: 'session-one', clinic, dentist, careCase: 'case-one', date: '2026-10-08', startTime: '09:00', endTime: '10:00', status: 'confirmed' }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCare],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: { currentUserValue: { firstName: 'Test', lastName: 'Patient' } } }],
    }).compileComponents();
    fixture = TestBed.createComponent(MyCare);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/care/my-record').flush(record);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('renders the selected visit and linked plan before opening the print dialog', fakeAsync(() => {
    const print = spyOn(window, 'print').and.callFake(() => {
      const report = fixture.nativeElement.querySelector('.care-print-only');
      expect(report?.textContent).toContain('Selected published summary');
      expect(report?.textContent).toContain('Published treatment plan');
      expect(report?.textContent).toContain('Oct 8, 2026');
      expect(report?.textContent).not.toContain('Other published summary');
      expect(report?.textContent).not.toContain('Unrelated plan');
    });
    fixture.componentInstance.print('visit-one');
    tick(20);
    expect(print).toHaveBeenCalledTimes(1);
  }));

  it('includes the case when printing a later treatment linked to that plan', fakeAsync(() => {
    spyOn(window, 'print').and.callFake(() => {
      const report = fixture.nativeElement.querySelector('.care-print-only');
      expect(report?.textContent).toContain('Linked treatment summary');
      expect(report?.textContent).toContain('Published treatment plan');
      expect(report?.textContent).not.toContain('Selected published summary');
      expect(report?.textContent).not.toContain('Unrelated plan');
    });
    fixture.componentInstance.print('visit-three');
    tick(20);
  }));

  it('restores all published records for browser printing after a selected print finishes', fakeAsync(() => {
    spyOn(window, 'print');
    fixture.componentInstance.print('visit-one');
    tick(20);
    window.dispatchEvent(new Event('afterprint'));
    fixture.detectChanges();
    const report = fixture.nativeElement.querySelector('.care-print-only');
    expect(report?.textContent).toContain('Selected published summary');
    expect(report?.textContent).toContain('Other published summary');
    expect(report?.textContent).toContain('Unrelated plan');
  }));
});
