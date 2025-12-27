import { inject, Injectable } from '@angular/core';
import { Settings } from '../models/settings';
import { Database, onValue, ref, update } from '@angular/fire/database';
import { AuthenticationService } from './authentication.service';
import { Observable, of, switchMap, take, tap } from 'rxjs';
import { User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly database = inject(Database);
  private readonly authenticationService = inject(AuthenticationService);
  settings$ = this.authenticationService.user$.pipe(
    switchMap(currentUser => {
      if (currentUser) {
        console.log(currentUser.uid);
        const userRef = ref(this.database, `users/${currentUser.uid}`);
        return new Observable<Settings>(observer => {
          onValue(userRef, snapshot => {
            const settings = snapshot.child('settings').val() as Settings;
            observer.next(settings);
          }, error => {
            observer.error(error);
          });
        });
      } else {
        return of(new Settings());
      }
    }));

  saveSettings(settings: Settings): Observable<User | null> {
    return this.authenticationService.user$.pipe(take(1), tap(async (currentUser) => {
      if (currentUser) {
        const settingsRef = ref(this.database, `users/${currentUser.uid}/settings`);
        await update(settingsRef, settings);
      }
    }));
  }

  resetSettings(): Observable<User | null> {
    return this.saveSettings(new Settings());
  }
}
