import { DentalChartsApiService } from '../dental-chart/dental-charts-api.service';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CareApiService } from '../care-api.service';
import { PatientRecordPage } from './patient-record';
import { PatientRecordSnapshot } from '../care.models';
const snapshot: PatientRecordSnapshot = { record: { patient: { _id: 'RAW_PATIENT_ID', firstName: 'Ana', lastName: 'Patient' }, appointments: [] }, visits: [], cases: [], generatedAt: '2026-10-20T00:00:00Z', scopeLabel: 'Assigned clinics' };
describe('Patient record export access', () => {
  let api: jasmine.Spy;
  const params = new BehaviorSubject(convertToParamMap({ id: 'RAW_PATIENT_ID' }));
  beforeEach(() => {
    api = jasmine.createSpy('snapshot').and.returnValue(of(snapshot));
    TestBed.configureTestingModule({ providers: [provideRouter([]),
      { provide: DentalChartsApiService, useValue: { clinics: () => of([]) } },
      { provide: CareApiService, useValue: { patientRecordSnapshot: api } },
      { provide: ActivatedRoute, useValue: { paramMap: params, queryParamMap: of(convertToParamMap({ clinic: 'clinic' })) } },
    ] });
  });
  it('hides raw record IDs and reloads the authorized snapshot when printing', () => {
    const fixture = TestBed.createComponent(PatientRecordPage); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toMatch(/RAW_PATIENT_ID|Record ID/);
    const printed = document.implementation.createHTMLDocument();
    spyOn(window, 'open').and.returnValue({ document: printed, opener: null, focus: () => {}, print: () => {}, close: () => {} } as unknown as Window);
    fixture.componentInstance.printRecord();
    expect(api).toHaveBeenCalledTimes(2); expect(printed.body.textContent).toContain('Ana Patient'); fixture.destroy();
  });
  it('does not export a cached record after access is revoked', () => {
    const fixture = TestBed.createComponent(PatientRecordPage); fixture.detectChanges();
    api.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'Outside your clinic' } })));
    const printed = document.implementation.createHTMLDocument(), print = jasmine.createSpy('print'), close = jasmine.createSpy('close');
    spyOn(window, 'open').and.returnValue({ document: printed, opener: null, focus: () => {}, print, close } as unknown as Window);
    fixture.componentInstance.printRecord();
    expect(print).not.toHaveBeenCalled(); expect(close).toHaveBeenCalled(); expect(fixture.componentInstance.record).toBeNull();
    expect(fixture.componentInstance.error).toContain('Outside'); fixture.destroy();
  });
  it('keeps the PDF fallback available when the browser blocks the print popup', () => {
    const fixture = TestBed.createComponent(PatientRecordPage); fixture.detectChanges(); spyOn(window, 'open').and.returnValue(null);
    fixture.componentInstance.printRecord(); expect(fixture.componentInstance.exportError).toContain('Allow pop-ups');
    expect(fixture.componentInstance.canExport).toBeTrue(); fixture.destroy();
  });
});
