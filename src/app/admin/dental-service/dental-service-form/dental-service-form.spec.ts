import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DentalService } from '../../../_shared/model/dental-service';
import { DentalServiceForm } from './dental-service-form';

describe('dental service submission contract', () => {
  let fixture: ComponentFixture<DentalServiceForm>;
  let submitted: DentalService[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DentalServiceForm] }).compileComponents();
    fixture = TestBed.createComponent(DentalServiceForm);
    fixture.componentRef.setInput('dentalService', { name: 'Braces', duration: 30 });
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
    expect(submitted).toEqual([{ name: 'Braces', duration: 90 }]);
  });

  it('keeps an existing service duration numeric when editing', () => {
    fixture.componentInstance.rxform.setValue({ name: 'Cleaning', duration: 60 });
    fixture.detectChanges();
    enterDuration('45');
    submit();
    expect(submitted).toEqual([{ name: 'Cleaning', duration: 45 }]);
  });

  it('preserves the API-supported zero duration', () => {
    enterDuration('0');
    submit();
    expect(submitted).toEqual([{ name: 'Braces', duration: 0 }]);
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
