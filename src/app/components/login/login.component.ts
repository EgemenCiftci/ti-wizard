import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardFooter, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { SnackBarService } from 'src/app/services/snack-bar.service';

@Component({
    selector: 'app-login',
    imports: [
        MatCard,
        MatCardHeader,
        MatCardContent,
        MatError,
        MatFormField,
        MatLabel,
        FormsModule,
        MatInput,
        MatCardTitle,
        MatCardActions,
        MatCheckbox,
        MatIcon,
        MatCardFooter,
        MatProgressBar,
        MatButton
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  isBusy = false;
  private authenticationService = inject(AuthenticationService);
  private router = inject(Router);
  private snackBarService = inject(SnackBarService);

  async login(email: string, password: string, isRemember: boolean) {
    try {
      this.isBusy = true;
      await this.authenticationService.signIn(email, password, isRemember);
      this.router.navigate(['']);
    } catch (error: any) {
      this.snackBarService.showSnackBar(error);
    } finally {
      this.isBusy = false;
    }
  }
}
