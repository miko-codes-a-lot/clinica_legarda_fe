import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DependentsPage } from './dependents';
import { provideRouter } from '@angular/router';
describe('child management', () => {
  it('creates a child without fabricated credentials and removes parent access without deleting the patient', () => {
    TestBed.configureTestingModule({ imports: [DependentsPage], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController), fixture = TestBed.createComponent(DependentsPage); fixture.detectChanges();
    http.expectOne('/dependents').flush([]);
    const component = fixture.componentInstance; component.form.setValue({ firstName: ' Alice ', middleName: '', lastName: ' Test ', birthDate: '2018-02-28', sex: '' }); component.save();
    const request = http.expectOne('/dependents'); expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ firstName: 'Alice', middleName: '', lastName: 'Test', birthDate: '2018-02-28', sex: '' }); request.flush({ _id: 'alice' });
    const child = { _id: 'alice', firstName: 'Alice', lastName: 'Test', birthDate: '2018-02-28' }; http.expectOne('/dependents').flush([child]);
    component.unlink(child); const remove = http.expectOne('/dependents/alice/guardian'); expect(remove.request.method).toBe('DELETE'); remove.flush({ message: 'Parent access removed.' }); http.expectOne('/dependents').flush([]);
    expect(component.children).toEqual([]); http.verify(); fixture.destroy();
  });
});
