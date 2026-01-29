import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    FormsModule,
    CommonModule
  ],
  template: `
    <h2 mat-dialog-title>Confirm</h2>

    <mat-dialog-content>
      <p class='dialog-main'>{{ data.message }}</p>

      <!-- Optional Checkbox -->
      <div *ngIf="data.showConsentCheckbox" class="consent-checkbox">
        <mat-checkbox [(ngModel)]="consentChecked">
          I agree and consent to transfer patient records
        </mat-checkbox>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">No</button>
      <button mat-raised-button color="primary" [disabled]="data.showConsentCheckbox && !consentChecked" (click)="close(true)">
        Yes
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-main {
      white-space: pre-line;
      line-height: 1.5;
      font-size: 14px;
      color: #333;
      margin: 0;
    }
    .consent-checkbox {
      margin-top: 1rem;
    }
  `]
})
export class ConfirmDialogComponent {
  consentChecked = false;

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string; showConsentCheckbox?: boolean }
  ) {}

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
