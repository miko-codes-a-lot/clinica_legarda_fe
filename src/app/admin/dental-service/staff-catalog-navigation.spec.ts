import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { DENTAL_SERVICE } from './dental-service.routes';
import { DentalServiceUpdate } from './dental-service-update/dental-service-update';
import { DentalServiceList } from './dental-service-list/dental-service-list';
import { DentalServicesService } from '../../_shared/service/dental-services-service';
import { ClinicService } from '../../_shared/service/clinic-service';
import { AlertService } from '../../_shared/service/alert.service';

// An absolute admin redirect or action sends super administrators outside their role routes.
for (const feature of ['service'] as const) {
  describe(`${feature} management navigation`, () => {
    let harness: RouterTestingHarness;
    beforeEach(async () => {
      await TestBed.configureTestingModule({ providers: [
        provideRouter([
          { path: 'admin/service', children: DENTAL_SERVICE },
          { path: 'super-admin/service', children: DENTAL_SERVICE },
        ]),
        { provide: DentalServicesService, useValue: { getAll: () => of([]), getOne: () => of({ _id: 'service-1', name: 'Cleaning', duration: 30, clinics: ['clinic-a'] }), update: (_id: string, doc: unknown) => of(doc), getEmptyOrNullDoc: () => ({ name: '', duration: 30, clinics: [] }) } },
        { provide: ClinicService, useValue: { getAccessible: () => of([{ _id: 'clinic-a', name: 'A' }]) } },
        { provide: AlertService, useValue: { error: jasmine.createSpy('error') } },
      ] }).compileComponents();
      harness = await RouterTestingHarness.create();
    });
    it('keeps a super-admin catalog landing in its own list route', async () => {
      await harness.navigateByUrl(`/super-admin/${feature}`);
      expect(TestBed.inject(Router).url).toBe(`/super-admin/${feature}/list`);
    });
    it('returns to the scoped list after removing all visible clinic availability', async () => {
      await harness.navigateByUrl('/admin/service/update/service-1');
      const editor = harness.routeDebugElement?.query(By.directive(DentalServiceUpdate))?.componentInstance as DentalServiceUpdate;
      editor.onSubmit({ name: 'Cleaning', duration: 30, clinics: [] });
      await harness.fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/admin/service/list');
    });
    it('keeps create navigation in the active staff role', async () => {
      await harness.navigateByUrl(`/super-admin/${feature}/list`);
      const component = harness.routeDebugElement?.query(By.directive(DentalServiceList))?.componentInstance as DentalServiceList;
      component.onCreate();
      await harness.fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe(`/super-admin/${feature}/create`);
    });
  });
}
