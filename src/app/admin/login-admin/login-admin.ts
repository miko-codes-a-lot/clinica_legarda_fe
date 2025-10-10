import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RxLogin } from '../../_shared/model/reactive/rx-login';
import { AuthService } from '../../_shared/service/auth-service';
import { Router } from '@angular/router';

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
        console.log('r', r)
        if (r.user.role === 'dentist') {
          this.router.navigate(['/dentist/profile'])
        } else {
          this.router.navigate(['/admin/dashboard'])
        }
      },
      error: (err) => alert(`Something went wrong: ${err}`)
    }).add(() => this.isLoading = false)
  }

  get username () {
    return this.rxform.controls.username
  }

  get password () {
    return this.rxform.controls.password
  }
}
