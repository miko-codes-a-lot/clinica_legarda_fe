import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { Clinic } from '../../_shared/model/clinic';
import { User, UserStatus } from '../../_shared/model/user';
import { UserForm } from '../../admin/user/user-form/user-form';
import { UserDetails as AdminUserDetails } from '../../admin/user/user-details/user-details';
import { UserCreate } from './user-create/user-create';
import { UserUpdate } from './user-update/user-update';
import { UserDetails } from './user-details/user-details';

const clinics: Clinic[] = ['Main', 'Annex'].map(name => ({
  _id: name.toLowerCase(), name, address: 'Manila', mobileNumber: '+639171234567',
  emailAddress: 'clinic@example.test', operatingHours: [], dentists: [],
}));
const admin: User = {
  _id: 'admin-1', firstName: 'Jamie', middleName: '', lastName: 'Reyes',
  emailAddress: 'jamie@example.test', mobileNumber: '+639171234567', address: 'Manila',
  username: 'jamie', role: 'admin', status: UserStatus.CONFIRMED,
  clinics, operatingHours: [], appointments: [],
};

describe('super admin clinic assignment screens', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'admin-1' } } } },
    ] });
    http = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });
  afterEach(() => http.verify());

  it('selects two clinics for a new admin and sends both in the create request', async () => {
    const fixture = TestBed.createComponent(UserCreate);
    fixture.detectChanges();
    http.expectOne('/clinics').flush(clinics);
    fixture.detectChanges();
    const form: UserForm = fixture.debugElement.query(By.directive(UserForm)).componentInstance;
    form.rxform.patchValue({
      ...admin, role: 'user', clinics: [], password: 'Password1!', passwordConfirm: 'Password1!',
    });
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const roleField = await loader.getHarness(MatFormFieldHarness.with({ floatingLabelText: 'Role' }));
    const role = await roleField.getControl(MatSelectHarness);
    await role?.clickOptions({ text: 'Admin' });
    const assignmentField = await loader.getHarnessOrNull(MatFormFieldHarness.with({ floatingLabelText: 'Clinics' }));
    const assignment = await assignmentField?.getControl(MatSelectHarness);
    expect(assignment).toBeTruthy();
    if (!assignment) return;
    await assignment.clickOptions({ text: 'Main' });
    await assignment.clickOptions({ text: 'Annex' });
    await assignment.close();
    form.onSubmit();
    const request = http.expectOne('/users');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(jasmine.objectContaining({
      role: 'admin', clinics: ['main', 'annex'], operatingHours: [], status: 'confirmed',
    }));
    request.flush(admin);
  });

  it('loads existing admin selections and sends the exact remaining clinic after removal', async () => {
    const fixture = TestBed.createComponent(UserUpdate);
    fixture.detectChanges();
    http.expectOne('/clinics').flush(clinics);
    http.expectOne('/users/admin-1').flush(admin);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const assignmentField = await loader.getHarnessOrNull(MatFormFieldHarness.with({ floatingLabelText: 'Clinics' }));
    const assignment = await assignmentField?.getControl(MatSelectHarness);
    expect(assignment).toBeTruthy();
    if (!assignment) return;
    expect(await assignment.getValueText()).toBe('Main, Annex');
    await assignment.clickOptions({ text: 'Main' });
    await assignment.close();
    const form: UserForm = fixture.debugElement.query(By.directive(UserForm)).componentInstance;
    form.onSubmit();
    const request = http.expectOne('/users/admin-1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.clinics).toEqual(['annex']);
    expect(request.request.body.password).toBeUndefined();
    request.flush({ ...admin, clinics: [clinics[1]] });
  });

  for (const details of [UserDetails, AdminUserDetails]) {
    it(`displays saved admin clinics without dentist schedules in ${details === UserDetails ? 'super admin' : 'admin'} details`, () => {
      const fixture = TestBed.createComponent<UserDetails | AdminUserDetails>(details);
      fixture.detectChanges();
      http.expectOne('/users/admin-1').flush(admin);
      fixture.detectChanges();
      const element: HTMLElement = fixture.nativeElement;
      expect(element.textContent?.replace(/\s+/g, ' ')).toContain('Main, Annex');
      expect(element.textContent).toContain('Clinics');
      expect(element.textContent).not.toContain('Schedule:');
    });
  }
});
