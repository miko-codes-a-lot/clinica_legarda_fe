import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Confirm</h2>

    <mat-dialog-content>
      <p class='dialog-main'>{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">No</button>
      <button mat-raised-button color="primary" (click)="close(true)">
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
  `]
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {}

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
