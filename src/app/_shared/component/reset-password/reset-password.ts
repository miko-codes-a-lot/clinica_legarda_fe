import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth-service';
import { UiStateService } from '../../service/ui-state-service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword {
  rxform!: FormGroup<{
    newPassword: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>
  isLoading = false
  emailAddress = ''

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

    this.rxform = this.fb.nonNullable.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.matchPasswords }
    )

    this.uiStateService.isLoading$.subscribe({
      next: (loading) => this.isLoading = loading
    })
  }

  private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const np = group.get('newPassword')?.value
    const cp = group.get('confirmPassword')?.value
    return np && cp && np !== cp ? { mismatch: true } : null
  }

  onSubmit() {
    this.uiStateService.setLoading(true)

    this.authService.resetPassword(this.emailAddress, this.newPassword.value).subscribe({
      next: () => {
        alert('Your password has been reset. Please log in with your new password.')
        this.router.navigate(['/app/login'])
      },
      error: (err) => alert(err.message)
    }).add(() => this.uiStateService.setLoading(false))
  }

  get newPassword() {
    return this.rxform.controls.newPassword
  }

  get confirmPassword() {
    return this.rxform.controls.confirmPassword
  }
}
