import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../service/auth-service';
import { UiStateService } from '../../service/ui-state-service';

@Component({
  selector: 'app-verify-otp',
  imports: [ReactiveFormsModule],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css'
})
export class VerifyOtp implements OnInit, OnDestroy {
  rxform!: FormGroup<{ code: FormControl<string> }>
  isLoading = false
  theme: 'patient' | 'admin' = 'patient'
  maskedEmail = ''
  redirectUrl = '/app/my-appointment'
  loginUrl = '/app/login'
  resendCooldown = 0
  private cooldownInterval: any = null
  private loadingSub?: Subscription

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly uiStateService: UiStateService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.theme = this.route.snapshot.data['theme'] || 'patient'
    this.redirectUrl = this.route.snapshot.data['redirectUrl'] || '/app/my-appointment'
    this.loginUrl = this.route.snapshot.data['loginUrl'] || '/app/login'

    const nav = history.state
    this.maskedEmail = nav?.maskedEmail || ''

    // Redirect to login if navigated directly without going through sign-in
    if (!this.maskedEmail) {
      this.router.navigate([this.loginUrl])
      return
    }

    this.rxform = this.fb.nonNullable.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]{6}$')]]
    })

    this.loadingSub = this.uiStateService.isLoading$.subscribe({
      next: (loading) => this.isLoading = loading
    })
  }

  ngOnDestroy() {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval)
    }
    this.loadingSub?.unsubscribe()
  }

  onSubmit() {
    this.uiStateService.setLoading(true)

    this.authService.verifyOtp(this.code.value).subscribe({
      next: (r) => {
        if (this.theme === 'admin') {
          if (r.user.role === 'dentist') {
            this.router.navigate(['/dentist/profile'])
          } else if (r.user.role === 'super-admin') {
            this.router.navigate(['/super-admin/dashboard'])
          } else {
            this.router.navigate([this.redirectUrl])
          }
        } else {
          this.router.navigate([this.redirectUrl])
        }
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

    this.authService.resendOtp().subscribe({
      next: () => alert('A new OTP has been sent to your email.'),
      error: (err) => alert(err.message)
    })
  }

  goBackToLogin() {
    this.router.navigate([this.loginUrl])
  }

  get code() {
    return this.rxform.controls.code
  }
}
