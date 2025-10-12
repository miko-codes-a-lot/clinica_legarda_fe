import { Component, Input } from '@angular/core';
import { RxLogin } from '../../_shared/model/reactive/rx-login';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../_shared/service/auth-service';
import { Router, RouterModule } from '@angular/router';
import { UiStateService } from '../../_shared/service/ui-state-service';

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
        this.router.navigate(['/app/my-appointment'])
      },
      error: (err) => alert(`Something went wrong: ${err}`)
    }).add(() => this.uiStateService.setLoading(false))
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