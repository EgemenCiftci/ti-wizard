import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {
  private readonly snackBar = inject(MatSnackBar);

  showSnackBar(message: string) {
    this.snackBar.open(message, 'X', {
      duration: 3000,
    });
  }
}
