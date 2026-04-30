import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertComponent } from '../component/alert/alert.component';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  constructor(private readonly snackBar: MatSnackBar) {}

  success(message: string) {
    this.open(message, 'success-snackbar');
  }

  error(message: string) {
    this.open(message, 'error-snackbar');
  }

  warning(message: string) {
    this.open(message, 'warning-snackbar');
  }

  info(message: string) {
    this.open(message, 'info-snackbar');
  }

  private open(message: string, panelClass: string) {
    this.snackBar.openFromComponent(AlertComponent, {
      duration: 3500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [panelClass],
      data: {
        message
      }
    });
  }
}