import { Component } from '@angular/core';
import { RegistrationPage } from '../registration'; // equivalent of registration.html // this is the UserForm
import { UserService } from '../../../_shared/service/user-service';
import { Router } from '@angular/router';
import { Day } from '../../../_shared/model/day';
import { Clinic } from '../../../_shared/model/clinic';
import { UserPayload } from '../../../admin/user/user-form/user-payload';

@Component({
  selector: 'app-registration-create',
  standalone: true,
  imports: [RegistrationPage],
  templateUrl: './registration-create.html',
  styleUrls: ['./registration-create.css'],

})
export class RegistrationCreate {
  isLoading = false
  clinics: Clinic[] = []
  days: Day[] = []


  constructor(
    private readonly userService: UserService,
    private readonly router: Router,
  ) {}

  onSubmit(user: UserPayload) {
    this.isLoading = true

    this.userService.createPublic(user).subscribe({
      next: () => this.router.navigate(['/app/login']), // navigate to login page
      error: (e) => {
        console.error(e);
        alert(`Something went wrong: ${e.error?.message || e.message}`);
      }
    }).add(() => this.isLoading = false);
  }
}
