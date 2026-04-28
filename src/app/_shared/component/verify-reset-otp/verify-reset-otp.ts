import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth-service';
import { UiStateService } from '../../service/ui-state-service';

@Component({
  selector: 'app-verify-reset-otp',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './verify-reset-otp.html',
  styleUrl: './verify-reset-otp.css'
})
export class VerifyResetOtp {
  rxform!: FormGroup<{ code: FormControl<string> }>
  isLoading = false
  emailAddress = ''
  resendCooldown = 0
  private cooldownInterval: any = null

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly uiStateService: UiStateService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.emailAddress = history.state?.emailAddress || ''

    if (!this.emailAddress) {
      this.router.navigate(['/app/forgot-password'])
      return
    }

    this.rxform = this.fb.nonNullable.group({
      code: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    })

    this.uiStateService.isLoading$.subscribe({
      next: (loading) => this.isLoading = loading
    })
  }

  ngOnDestroy() {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval)
  }

  onSubmit() {
    this.uiStateService.setLoading(true)

    this.authService.verifyResetOtp(this.emailAddress, this.code.value).subscribe({
      next: () => {
        this.router.navigate(['/app/reset-password'], { state: { emailAddress: this.emailAddress } })
      },
      error: (err) => alert(err.message)
    }).add(() => this.uiStateService.setLoading(false))
  }

  onResend() {
    this.resendCooldown = 60
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownInterval)
        this.cooldownInterval = null
      }
    }, 1000)

    this.authService.forgotPassword(this.emailAddress).subscribe({
      next: () => alert('A new OTP has been sent to your phone.'),
      error: (err) => alert(err.message)
    })
  }

  get code() {
    return this.rxform.controls.code
  }
}
