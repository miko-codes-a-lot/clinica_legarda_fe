import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../_shared/service/auth-service';
import { CareApiService } from '../care-api.service';
import { CareVisit } from '../care.models';
import { VisitDetail } from './visit-detail';
describe('Unsaved clinical treatment structure', () => {
  it('keeps case creation on the clinical editor until a removed treatment is saved', () => {
    const createCase = jasmine.createSpy('createCase'), navigate = jasmine.createSpy('navigate');
    TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:{currentUserValue:{role:'super-admin'}}},{provide:CareApiService,useValue:{createCase}},{provide:ActivatedRoute,useValue:{}},{provide:Router,useValue:{url:'/super-admin/care/visits/visit',navigate}}]});
    const editor = TestBed.runInInjectionContext(() => new VisitDetail());
    editor.visit = { _id:'visit',state:'in_progress',dentist:{_id:'doctor'},clinic:{_id:'clinic'} } as CareVisit;
    editor.addTreatment(); editor.form.markAsPristine(); editor.removeTreatment(0);
    expect(editor.form.dirty).toBeTrue(); editor.caseForm.setValue({title:'Demo case',plan:'Demo plan',internalNotes:''});
    editor.createCase(); expect(createCase).not.toHaveBeenCalled(); expect(navigate).not.toHaveBeenCalled();
    editor.form.markAsPristine(); editor.addTreatment(); expect(editor.form.dirty).toBeTrue();
  });
});
