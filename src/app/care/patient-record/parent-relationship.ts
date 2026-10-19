import { Observable } from 'rxjs';
import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { DependentsApiService, PatientIdentity } from '../../client/dependents/dependents-api.service';
import { CarePerson } from '../care.models';
import { careError } from '../care-api.service';
import { UserStatus } from '../../_shared/model/user';
@Component({ selector: 'app-parent-relationship', imports: [FormsModule], template: `
  <section class="ui-card mb-6"><h2 class="ui-section-title">Parent access</h2><p class="ui-muted mt-2">{{ patient?.isDependent ? 'This patient is managed through a parent account and has no independent sign-in.' : 'Clinic staff can link this existing patient record to a verified parent account.' }}</p>
    @if (error) { <p class="ui-alert-error mt-3" role="alert">{{ error }}</p> }
    @if (patient?.guardian) { <p class="my-3">A parent is currently linked.</p><button type="button" class="ui-button-secondary" (click)="removing = true" [disabled]="saving">Remove parent access</button>
      @if (removing) { <p class="ui-muted my-3">The parent will lose access immediately. The patient’s clinic records stay intact.</p><button class="ui-button-danger" type="button" (click)="unlink()" [disabled]="saving">Confirm removal</button><button class="ui-button-ghost" type="button" (click)="removing = false">Keep access</button> }
    } @else { <form class="mt-4" (ngSubmit)="lookup()"><label class="ui-label">Parent’s verified email<input class="ui-input mt-2 w-full" type="email" [(ngModel)]="email" name="email" required maxlength="254"></label><button class="ui-button-secondary mt-3" type="submit" [disabled]="saving || !email.trim()">Find parent account</button></form>
      @if (candidate) { <div class="mt-4 rounded-xl border border-stroke p-4"><p>{{ candidate.firstName }} {{ candidate.lastName }} · {{ candidate.emailAddress }}</p><label class="my-3 flex items-start gap-3"><input type="checkbox" [(ngModel)]="confirmed" [disabled]="saving"><span>I checked the parent relationship with the patient/family. This will give this parent access to the patient’s appointments and published care summaries, and disable the patient’s independent sign-in.</span></label><button class="ui-button" type="button" (click)="link()" [disabled]="!confirmed || saving">Confirm parent link</button></div> }
    }
  </section>` })
export class ParentRelationship implements OnChanges {
  @Input() patient: CarePerson | null = null; @Output() updated = new EventEmitter<Partial<CarePerson>>();
  private readonly api = inject(DependentsApiService); private readonly http = inject(HttpClient); private readonly destroyRef = inject(DestroyRef);
  email = ''; saving = false; error = ''; confirmed = false; removing = false; private version = 0;
  candidate: { _id: string; firstName: string; lastName: string; emailAddress: string } | null = null;
  ngOnChanges() { this.version++; this.candidate = null; this.confirmed = false; this.removing = false; this.error = ''; this.saving = false; }
  lookup() {
    if (!this.patient || this.saving) return; const version = this.version; this.saving = true; this.error = ''; this.candidate = null; this.confirmed = false;
    this.http.post<NonNullable<typeof this.candidate> | null>(`/dependents/${this.patient._id}/guardian-candidate`, { emailAddress: this.email.trim() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: candidate => { if (version !== this.version) return; this.saving = false; this.candidate = candidate; if (!candidate) this.error = 'No confirmed, email-verified parent account matches that email.'; }, error: error => { if (version !== this.version) return; this.saving = false; this.error = careError(error); } });
  }
  link() { if (this.patient && this.candidate && this.confirmed && !this.saving) this.save(this.api.link(this.patient._id, this.candidate._id)); }
  unlink() { if (this.patient?.guardian && !this.saving) this.save(this.api.unlink(this.patient._id, this.patient.guardian), true); }
  private save(request: Observable<PatientIdentity | { message: string }>, unlink = false) {
    const version = this.version; this.saving = true; this.error = '';
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: result => { if (version !== this.version) return; this.saving = false; this.updated.emit(unlink ? { guardian: undefined, status: UserStatus.WALK_IN, isWalkIn: true } : '_id' in result ? result : {}); }, error: error => { if (version !== this.version) return; this.saving = false; this.error = careError(error); } });
  }
}
