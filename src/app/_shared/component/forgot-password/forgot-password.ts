import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth-service';
import { UiStateService } from '../../service/ui-state-service';
import { AlertService } from '../../service/alert.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  rxform!: FormGroup<{ emailAddress: FormControl<string> }>
  isLoading = false

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly uiStateService: UiStateService,
    private readonly router: Router,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit() {
    this.rxform = this.fb.nonNullable.group({
      emailAddress: ['', [Validators.required, Validators.email]]
    })

    this.uiStateService.isLoading$.subscribe({
      next: (loading) => this.isLoading = loading
    })
  }

  onSubmit() {
    this.uiStateService.setLoading(true)
    const email = this.emailAddress.value

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.router.navigate(['/app/verify-reset-otp'], { state: { emailAddress: email } })
      },
      error: (err) => this.alertService.error(err.message)
    }).add(() => this.uiStateService.setLoading(false))
  }

  get emailAddress() {
    return this.rxform.controls.emailAddress
  }
}
