import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, EventEmitter, Input, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { filter, finalize, switchMap, take } from 'rxjs';
import { User, UserStatus } from '../../model/user';
import { AlertService } from '../../service/alert.service';
import { UserService } from '../../service/user-service';
import { ConfirmDialogComponent } from '../dialog/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-dentist-approval',
  imports: [MatButtonModule],
  templateUrl: './dentist-approval.html',
})
export class DentistApproval {
  @Input({ required: true }) user!: User;
  @Output() approved = new EventEmitter<User>();

  isApproving = false;
  approvalError = '';
  private readonly destroyRef = inject(DestroyRef);
  private readonly users = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly alerts = inject(AlertService);

  get canApprove(): boolean {
    return this.user.role === 'dentist' && this.user.status === UserStatus.PENDING && !!this.user._id;
  }

  get statusLabel(): string {
    switch (this.user.status) {
      case UserStatus.PENDING: return 'Pending approval';
      case UserStatus.CONFIRMED: return 'Approved';
      case UserStatus.REJECTED: return 'Rejected';
      default: return 'Not set';
    }
  }

  approveDentist(): void {
    const id = this.user._id;
    if (!id || !this.canApprove || this.isApproving) return;
    this.isApproving = true;
    this.approvalError = '';
    this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: { message: `Approve ${this.user.firstName} ${this.user.lastName} for patient bookings at their assigned clinics?` },
    }).afterClosed().pipe(
      take(1),
      filter((confirmed: unknown) => confirmed === true),
      switchMap(() => this.users.approveDentist(id)),
      finalize(() => this.isApproving = false),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: user => {
        this.approved.emit(user);
        this.alerts.success('Dentist approved for bookings.');
      },
      error: (error: unknown) => {
        const message: unknown = error instanceof HttpErrorResponse ? error.error?.message : undefined;
        this.approvalError = typeof message === 'string'
          ? message : 'Unable to approve this dentist. Please try again.';
      },
    });
  }
}
