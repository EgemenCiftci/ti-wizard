import { Component, inject } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { SnackBarService } from 'src/app/services/snack-bar.service';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatMiniFabButton } from '@angular/material/button';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { AsyncPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatToolbar,
    MatIcon,
    MatButton,
    MatMenu,
    MatMenuItem,
    MatTooltip,
    MatMiniFabButton,
    MatMenuTrigger,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    AsyncPipe,
    HeaderComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  authenticationService = inject(AuthenticationService);
  private snackBarService = inject(SnackBarService);
  private router = inject(Router);

  async logout() {
    try {
      await this.authenticationService.signOut();
      this.router.navigate(['login']);
    } catch (error: any) {
      this.snackBarService.showSnackBar(error);
    }
  }
}
