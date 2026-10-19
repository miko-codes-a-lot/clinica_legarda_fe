import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ParentRelationship } from './parent-relationship';
describe('staff-confirmed parent relationships', () => {
  it('requires an explicit confirmation before linking and sends the current relationship when removing', () => {
    TestBed.configureTestingModule({ imports: [ParentRelationship], providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController), fixture = TestBed.createComponent(ParentRelationship);
    fixture.componentRef.setInput('patient', { _id: 'child', firstName: 'Child', lastName: 'Test' }); fixture.detectChanges();
    const component = fixture.componentInstance; component.email = 'parent@clinic-mail.ph'; component.lookup();
    http.expectOne('/dependents/child/guardian-candidate').flush({ _id: 'parent', firstName: 'Parent', lastName: 'Test', emailAddress: component.email });
    component.link(); http.expectNone('/dependents/child/guardian'); component.confirmed = true; component.link();
    const link = http.expectOne('/dependents/child/guardian'); expect(link.request.body).toEqual({ guardian: 'parent', confirmExistingPatient: true }); link.flush({ _id: 'child', firstName: 'Child', lastName: 'Test', guardian: 'parent' });
    fixture.componentRef.setInput('patient', { _id: 'child', firstName: 'Child', lastName: 'Test', guardian: 'parent', isDependent: true }); fixture.detectChanges();
    component.unlink(); const remove = http.expectOne('/dependents/child/guardian?expectedGuardian=parent'); expect(remove.request.method).toBe('DELETE'); remove.flush({ message: 'Access removed' }); http.verify(); fixture.destroy();
  });
});
