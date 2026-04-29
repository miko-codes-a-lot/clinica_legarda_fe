import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RxLogin } from '../../_shared/model/reactive/rx-login';
import { AuthService } from '../../_shared/service/auth-service';
import { Router } from '@angular/router';
import { AlertService } from '../../_shared/service/alert.service';

@Component({
  selector: 'app-login-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './login-admin.html',
  styleUrl: './login-admin.css'
})
export class LoginAdmin {
  rxform!: FormGroup<RxLogin>
  isLoading = false

  constructor(
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
          this.router.navigate(['/admin/dashboard'])
        }
      }
    })
  }

  onSubmit() {
    this.isLoading = true
    this.authService.login(this.username.value, this.password.value).subscribe({
      next: (r) => {
        if (r.otpRequired) {
          this.router.navigate(['/admin/verify-otp'], {
            state: { maskedEmail: this.maskEmail(r.user.emailAddress) }
          })
        } else if (r.user.role === 'dentist') {
          this.router.navigate(['/dentist/homepage'])
        } else {
          this.router.navigate(['/admin/dashboard'])
        }
      },
      error: (err) => this.alertService.error(err.error.message)
    }).add(() => this.isLoading = false)
  }

  private maskEmail(email: string): string {
    if (!email) return ''
    const [local, domain] = email.split('@')
    const masked = local.length <= 2
      ? local[0] + '***'
      : local[0] + '***' + local[local.length - 1]
    return masked + '@' + domain
  }

  get username () {
    return this.rxform.controls.username
  }

  get password () {
    return this.rxform.controls.password
  }
}
