import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-notes-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatInputModule],
  templateUrl: './notes-dialog.component.html',
  styleUrls: ['./notes-dialog.component.css']
})
export class NotesDialogComponent {
  form: FormGroup;
  initialNotes: string;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<NotesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { clinicNotes: string }
  ) {
    this.initialNotes = data.clinicNotes || '';
    this.form = this.fb.group({
      clinicNotes: [this.initialNotes]
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.form.valid && this.form.dirty && this.form.value.clinicNotes !== this.initialNotes) {
      this.dialogRef.close(this.form.value.clinicNotes);
    }
  }

  get clinicNotesControl() {
    return this.form.get('clinicNotes');
  }
}
