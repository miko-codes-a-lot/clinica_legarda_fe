import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AppointmentCareLinks } from './appointment-care-links';
import { CareApiService } from '../care-api.service';
import { ClosuresApiService } from '../closures/closures-api.service';
import { AuthService } from '../../_shared/service/auth-service';
import { dentistAppointment } from '../../dentist/appointment/appointment-test-fixtures';
import { AppointmentStatus } from '../../_shared/model/appointment';

describe('Closure restoration instructions', () => {
  const clear = jasmine.createSpy('clear').and.returnValue(of({}));
  beforeEach(async () => {
    clear.calls.reset();
    await TestBed.configureTestingModule({ imports: [AppointmentCareLinks], providers: [provideRouter([]),
      { provide: CareApiService, useValue: { visits: () => of([]) } },
      { provide: ClosuresApiService, useValue: { clear } },
      { provide: AuthService, useValue: { currentUserValue: { role: 'admin' } } },
    ] }).compileComponents();
  });
  it('routes a closure replacement through agreement instead of pretending clearing its flag restores it', () => {
    const fixture = TestBed.createComponent(AppointmentCareLinks);
    fixture.componentInstance.appointment = dentistAppointment({ status: AppointmentStatus.NEEDS_RESCHEDULING,
      disruption: { closures: ['closure'], flaggedAt: '2030-10-22', message: 'Repairs' },
      closureRescheduling: { originalStatus: 'confirmed', originalSchedule: { date: '2030-11-02', startTime: '10:00', endTime: '10:30' }, enteredAt: '2030-10-22', expiresAt: '2030-10-29', reasons: ['Repairs'] },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Reopening alone does not confirm');
    expect(fixture.nativeElement.textContent).not.toContain('Clear flag after reopening');
    fixture.componentInstance.resolutionReason.setValue('Clinic reopened');
    fixture.componentInstance.resolveFlag();
    expect(clear).not.toHaveBeenCalled();
  });
  it('retains the existing flag-only action for a legacy disrupted appointment', () => {
    const fixture = TestBed.createComponent(AppointmentCareLinks);
    fixture.componentInstance.appointment = dentistAppointment({ disruption: { closures: ['closure'], flaggedAt: '2030-10-22', message: 'Repairs' } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Clear flag after reopening');
    fixture.componentInstance.resolutionReason.setValue('Reviewed after reopening');
    fixture.componentInstance.resolveFlag();
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
