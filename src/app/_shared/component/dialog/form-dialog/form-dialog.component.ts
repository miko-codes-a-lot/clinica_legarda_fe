import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  standalone: true,
  imports: [CommonModule, MatInputModule, MatButtonModule, FormsModule, MatDialogModule, MatSelectModule, MatFormFieldModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <mat-dialog-content>
      <div *ngFor="let field of data.fields">
        <mat-form-field appearance="outline" style="width:100%; margin-top: 1rem;">
          <mat-label>{{ field.label }}</mat-label>

          <!-- TEXT -->
          <input
            *ngIf="field.type === 'text'"
            matInput
            [(ngModel)]="form[field.name]"
          />

          <!-- TEXTAREA -->
          <textarea
            *ngIf="field.type === 'textarea'"
            matInput
            rows="4"
            [(ngModel)]="form[field.name]">
          </textarea>

          <!-- SELECT -->
          <mat-select
            *ngIf="field.type === 'select'"
            [(ngModel)]="form[field.name]">
            <mat-option
              *ngFor="let opt of field.options"
              [value]="opt.value">
              {{ opt.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">Cancel</button>
      <button mat-raised-button color="primary"
        [disabled]="!isValid()"
        (click)="close(true)">
        Confirm
      </button>
    </mat-dialog-actions>
  `
})
export class FormDialogComponent {
  form: any = {};

  constructor(
    private dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // initialize form fields
    data.fields.forEach((f: any) => this.form[f.name] = '');
  }

  isValid() {
    return this.data.fields.every((f: any) => {
      if (!f.required) return true;
      const value = this.form[f.name];
      return value !== null && value !== undefined && value !== '';
    });
  }

  close(result: boolean) {
    this.dialogRef.close({ result, data: this.form });
  }
}
