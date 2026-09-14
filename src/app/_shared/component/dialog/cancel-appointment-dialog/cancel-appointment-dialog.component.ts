import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-cancel-appointment-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Cancel appointment</h2>
    <mat-dialog-content>
      <p>Please tell the clinic why you need to cancel.</p>
      <mat-form-field appearance="outline" style="width: 100%">
        <mat-label>Reason for cancellation</mat-label>
        <textarea matInput [formControl]="reason" rows="3" maxlength="500" required></textarea>
        <mat-hint>Up to 500 characters.</mat-hint>
        <mat-error>Please enter a reason.</mat-error>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Keep appointment</button>
      <button mat-flat-button (click)="confirm()" [disabled]="reason.invalid">Cancel appointment</button>
    </mat-dialog-actions>
  `,
})
export class CancelAppointmentDialogComponent {
  readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)],
  });

  constructor(private readonly dialogRef: MatDialogRef<CancelAppointmentDialogComponent, string>) {}

  confirm(): void {
    this.reason.markAsTouched();
    if (this.reason.valid) this.dialogRef.close(this.reason.value.trim());
  }
}
