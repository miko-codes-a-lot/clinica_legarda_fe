import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { matchesTableQuery } from '../../../_shared/component/table/table-model';
import { Clinic } from '../../../_shared/model/clinic';
import { AuthService } from '../../../_shared/service/auth-service';
import { AlertService } from '../../../_shared/service/alert.service';
import { ClinicList } from './clinic-list';

describe('Clinic list appointment-only availability', () => {
  it('includes a by-appointment Sunday clinic in the Sunday filter and explains its availability', () => {
    TestBed.configureTestingModule({ imports: [ClinicList], providers: [provideRouter([]), provideHttpClient(),
      { provide: AuthService, useValue: { currentUserValue: { role: 'super-admin' } } },
      { provide: AlertService, useValue: {} }],
    });
    const list = TestBed.createComponent(ClinicList).componentInstance;
    const clinic: Clinic = { name: 'Care clinic', address: 'Manila', mobileNumber: '', emailAddress: '', dentists: [],
      operatingHours: [{ day: 'monday', startTime: '09:30', endTime: '16:00' }], appointmentOnlyDays: ['sunday'] };
    const query = { search: '', filters: { day: 'sunday' }, from: '', to: '' };
    expect(matchesTableQuery(clinic, list.columnDefs, list.filters, query)).toBeTrue();
    expect(list.columnDefs.find(column => column.key === 'hours')?.cell?.(clinic)).toContain('sun (by appointment)');
  });
});
