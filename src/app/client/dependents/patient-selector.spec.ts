import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PatientSelector } from './patient-selector';
import { UserStatus } from '../../_shared/model/user';
describe('parent patient selection', () => {
  it('shows distinct child names and resets a removed child to self on refresh', () => {
    TestBed.configureTestingModule({ imports: [PatientSelector], providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController), fixture = TestBed.createComponent(PatientSelector);
    fixture.componentRef.setInput('self', { _id: 'parent', firstName: 'Parent', lastName: 'Test', status: UserStatus.CONFIRMED });
    fixture.detectChanges();
    http.expectOne('/dependents').flush([{ _id: 'alice', firstName: 'Alice', lastName: 'Test' }, { _id: 'bob', firstName: 'Bob', lastName: 'Test' }]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Alice Test'); expect(fixture.nativeElement.textContent).toContain('Bob Test');
    const changes = jasmine.createSpy('changes'); fixture.componentInstance.patientChange.subscribe(changes);
    fixture.componentInstance.select('alice'); expect(changes).toHaveBeenCalledWith(jasmine.objectContaining({ _id: 'alice' }));
    fixture.componentInstance.refresh(); http.expectOne('/dependents').flush([]);
    expect(changes).toHaveBeenCalledWith(jasmine.objectContaining({ _id: 'parent' })); http.verify(); fixture.destroy();
  });
});
