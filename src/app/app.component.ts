import { Component, inject } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { AuthenticationService } from './services/authentication.service';
import { AsyncPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { SnackBarService } from './services/snack-bar.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    standalone: true,
    imports: [MatToolbar, MatIcon, MatButton, MatMenu, MatTooltip, MatMenuTrigger, RouterLink, RouterLinkActive, RouterOutlet, AsyncPipe]
})
export class AppComponent {
    authenticationService = inject(AuthenticationService);
    private snackBarService = inject(SnackBarService);
    private router = inject(Router);

    async logout() {
        try {
            await this.authenticationService.signOut();
            this.router.navigate(['']);
        } catch (error: any) {
            this.snackBarService.showSnackBar(error);
        }
    }
}
