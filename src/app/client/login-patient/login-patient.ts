import { Component, Input } from '@angular/core';
import { RxLogin } from '../../_shared/model/reactive/rx-login';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../_shared/service/auth-service';
import { Router, RouterModule } from '@angular/router';
import { UiStateService } from '../../_shared/service/ui-state-service';
import { AlertService } from '../../_shared/service/alert.service';

@Component({
  selector: 'app-login-patient',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './login-patient.html',
  styleUrl: './login-patient.css'
})
export class LoginPatient {
  rxform!: FormGroup<RxLogin>
  isLoading = false

  constructor(
    private readonly uiStateService: UiStateService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly alertService: AlertService,

  ) {}

  ngOnInit() {
    this.rxform = this.fb.nonNullable.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    })

    this.authService.currentUser$.subscribe({
      next: (u) => {
        if (u) {
          this.router.navigate(['/app/my-appointment'])
        }
      }
    })

    this.uiStateService.isLoading$.subscribe({
      next: (loading) => this.isLoading = loading
    })
  }

  onSubmit() {
    this.uiStateService.setLoading(true)

    this.authService.login(this.username.value, this.password.value).subscribe({
      next: (r) => {
        if (r.otpRequired) {
          this.router.navigate(['/app/verify-otp'], {
            state: { maskedEmail: this.maskEmail(r.user.emailAddress) }
          })
        } else {
          this.router.navigate(['/app/my-appointment'])
        }
      },
      error: (err) => {
        this.alertService.error(err)
      }
    }).add(() => this.uiStateService.setLoading(false))
  }

  private maskEmail(email: string): string {
    if (!email) return ''
    const [local, domain] = email.split('@')
    const masked = local.length <= 2
      ? local[0] + '***'
      : local[0] + '***' + local[local.length - 1]
    return masked + '@' + domain
  }

  goToRegister() {
    // Navigate to registration page, e.g., using Angular Router
    this.router.navigate(['/app/registration']);
  }

  get username () {
    return this.rxform.controls.username
  }

  get password () {
    return this.rxform.controls.password
  }
}