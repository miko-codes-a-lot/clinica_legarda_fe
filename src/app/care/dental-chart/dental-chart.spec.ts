import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DentalChart } from './dental-chart';
import { DentalChartsApiService } from './dental-charts-api.service';
import { DentalChartResponse } from './dental-chart.models';
const response = (): DentalChartResponse => ({ chart: { _id: 'chart', patient: 'patient', clinic: { _id: 'clinic', name: 'Test clinic' }, dentition: 'permanent', revision: 1, teeth: [{ tooth: 11, observation: 'Existing observation', notes: '' }], updatedBy: { _id: 'dentist', firstName: 'Test', lastName: 'Dentist' }, updatedAt: '2026-10-20T02:00:00Z' }, currentRevision: 1, history: [] });
describe('staff dental chart', () => {
  let api: { clinics: jasmine.Spy; read: jasmine.Spy; save: jasmine.Spy };
  beforeEach(() => {
    api = { clinics: jasmine.createSpy().and.returnValue(of([{ _id: 'clinic', name: 'Test clinic' }])), read: jasmine.createSpy().and.returnValue(of(response())), save: jasmine.createSpy().and.returnValue(of({ ...response(), currentRevision: 2 })) };
    TestBed.configureTestingModule({ imports: [DentalChart], providers: [{ provide: DentalChartsApiService, useValue: api }] });
  });
  function fixture() { const fixture = TestBed.createComponent(DentalChart); fixture.componentRef.setInput('patientId','patient'); fixture.componentRef.setInput('clinic','clinic'); fixture.componentRef.setInput('canWrite',true); fixture.detectChanges(); return fixture; }
  it('shows every permanent tooth and saves only manual observations with expected revision', () => {
    const view = fixture(), component = view.componentInstance;
    expect(view.nativeElement.querySelectorAll('[data-tooth]').length).toBe(32);
    expect(view.nativeElement.textContent).toContain('Blank teeth mean no observation entered');
    component.selectTooth(11); component.setObservation('Changed by clinician'); component.save();
    expect(api.save).toHaveBeenCalledWith('patient', { clinic: 'clinic', dentition: 'permanent', expectedRevision: 1, teeth: [{ tooth: 11, observation: 'Changed by clinician', notes: '' }] }); view.destroy();
  });
  it('keeps historical revisions read-only and shows primary numbering separately', () => {
    const view = fixture(), component = view.componentInstance;
    component.load(1); component.setObservation('Forbidden history edit'); component.save(); expect(api.save).not.toHaveBeenCalled();
    api.read.and.returnValue(of({ chart: null, currentRevision: 0, history: [] })); component.changeDentition('primary'); view.detectChanges();
    expect(view.nativeElement.querySelectorAll('[data-tooth]').length).toBe(20); expect(view.nativeElement.querySelector('[data-tooth="51"]')).not.toBeNull(); expect(view.nativeElement.querySelector('[data-tooth="11"]')).toBeNull(); view.destroy();
  });
  it('retains a conflicting draft and requires reloading after a stale revision error', () => {
    const view = fixture(), component = view.componentInstance; component.selectTooth(11); component.setObservation('My draft');
    api.save.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { message: 'The dental chart changed. Reload before saving.' } }))); component.save();
    expect(component.error).toContain('Reload'); expect(component.observation).toBe('My draft'); view.destroy();
  });
});
