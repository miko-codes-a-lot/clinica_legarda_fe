import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { By } from '@angular/platform-browser';
import { MatDrawer } from '@angular/material/sidenav';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../_shared/service/auth-service';
import { AlertService } from '../_shared/service/alert.service';
import { dentistUser } from './appointment/appointment-test-fixtures';
import { Dentist } from './dentist';

 describe('Dentist navigation', () => {
  let fixture: ComponentFixture<Dentist>;
  let breakpoint: BehaviorSubject<BreakpointState>;

  beforeEach(async () => {
    breakpoint = new BehaviorSubject<BreakpointState>({ matches: true, breakpoints: {} });
    await TestBed.configureTestingModule({
      imports: [Dentist],
      providers: [
        provideRouter([]),
        { provide: BreakpointObserver, useValue: { observe: () => breakpoint } },
        { provide: AuthService, useValue: { currentUser$: of(dentistUser) } },
        { provide: AlertService, useValue: { error: () => undefined } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Dentist);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('starts mobile navigation closed and opens it over the content with the menu button', () => {
    const drawer = fixture.debugElement.query(By.directive(MatDrawer)).componentInstance as MatDrawer;
    expect(drawer.mode).toBe('over');
    expect(drawer.opened).toBeFalse();
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Open navigation menu"]');
    expect(button).not.toBeNull();
    button?.click();
    fixture.detectChanges();
    expect(drawer.opened).toBeTrue();
  });

  it('keeps navigation beside the content on desktop', () => {
    breakpoint.next({ matches: false, breakpoints: {} });
    fixture.detectChanges();
    const drawer = fixture.debugElement.query(By.directive(MatDrawer)).componentInstance as MatDrawer;
    expect(drawer.mode).toBe('side');
    expect(drawer.opened).toBeTrue();
  });
});
