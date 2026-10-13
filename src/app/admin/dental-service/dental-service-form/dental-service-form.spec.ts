import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DentalService } from '../../../_shared/model/dental-service';
import { FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { ClinicService } from '../../../_shared/service/clinic-service';
import { DentalServiceForm } from './dental-service-form';

describe('dental service submission contract', () => {
  let fixture: ComponentFixture<DentalServiceForm>;
  let submitted: (DentalService & { clinics?: string[] })[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DentalServiceForm], providers: [{ provide: ClinicService, useValue: { getAccessible: () => of([{ _id: 'clinic-a', name: 'Clinic A' }, { _id: 'clinic-b', name: 'Clinic B' }]) } }] }).compileComponents();
    fixture = TestBed.createComponent(DentalServiceForm);
    fixture.componentRef.setInput('dentalService', { name: 'Braces', duration: 30, clinics: ['clinic-a'] });
    submitted = [];
    fixture.componentInstance.onSubmitEvent.subscribe(value => submitted.push(value));
    fixture.detectChanges();
  });

  function enterDuration(value: string): void {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type="number"]')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): void {
    const form = (fixture.nativeElement as HTMLElement).querySelector('form')!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('sends an edited duration as a JSON number when creating a service', () => {
    enterDuration('90');
    submit();
    expect(submitted).toEqual([{ name: 'Braces', duration: 90, clinics: ['clinic-a'] }]);
  });

  it('keeps an existing service duration numeric when editing', () => {
    fixture.componentInstance.rxform.patchValue({ name: 'Cleaning', duration: 60 });
    fixture.detectChanges();
    enterDuration('45');
    submit();
    expect(submitted).toEqual([{ name: 'Cleaning', duration: 45, clinics: ['clinic-a'] }]);
  });

  it('preserves the API-supported zero duration', () => {
    enterDuration('0');
    submit();
    expect(submitted).toEqual([{ name: 'Braces', duration: 0, clinics: ['clinic-a'] }]);
  });

  it('provides a labelled multi-clinic selector and submits selected assignments', () => {
    const control = (fixture.componentInstance.rxform as FormGroup).get('clinics');
    expect(control).not.toBeNull();
    control?.setValue(['clinic-a', 'clinic-b']);
    fixture.detectChanges();
    const selector = (fixture.nativeElement as HTMLElement).querySelector('mat-select');
    (selector as HTMLElement | null)?.click();
    fixture.detectChanges();
    expect(document.querySelector('[role="listbox"]')?.getAttribute('aria-multiselectable')).toBe('true');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Available at clinics');
    submit();
    expect(submitted).toEqual([{ name: 'Braces', duration: 30, clinics: ['clinic-a', 'clinic-b'] }]);
  });

  it('allows removing availability without changing protected shared details', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(DentalServiceForm);
    fixture.componentRef.setInput('dentalService', { _id: 'existing-service', name: 'Shared treatment', duration: 45, clinics: ['clinic-a'], canEditDetails: false });
    fixture.componentInstance.onSubmitEvent.subscribe(value => submitted.push(value));
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type="number"]');
    expect(input?.readOnly).toBeTrue();
    (fixture.componentInstance.rxform as FormGroup).get('clinics')?.setValue([]);
    submit();
    expect(submitted).toEqual([{ name: 'Shared treatment', duration: 45, clinics: [] }]);
  });

  it('does not submit an empty duration', () => {
    enterDuration('');
    submit();
    expect(submitted).toEqual([]);
  });

  it('does not submit a negative duration', () => {
    enterDuration('-5');
    submit();
    expect(submitted).toEqual([]);
  });

  it('does not submit a service name shorter than the API minimum', () => {
    fixture.componentInstance.name.setValue('AB');
    submit();
    expect(submitted).toEqual([]);
  });
});
