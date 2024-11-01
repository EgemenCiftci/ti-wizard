import { inject, Injectable } from '@angular/core';
import { Auth, authState, inMemoryPersistence, signInWithEmailAndPassword, signOut, user, UserCredential } from '@angular/fire/auth';
import { browserLocalPersistence, setPersistence } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  auth: Auth = inject(Auth);
  user$ = user(this.auth);
  authState$ = authState(this.auth);
  userCredential: UserCredential | undefined;

  constructor() {
  }

  async signIn(email: string, password: string, isRemember: boolean) {
    if (isRemember) {
      await setPersistence(this.auth, browserLocalPersistence);
    } else {
      await setPersistence(this.auth, inMemoryPersistence);
    }
    this.userCredential = await signInWithEmailAndPassword(this.auth, email, password);
  }

  async signOut() {
    await signOut(this.auth);
  }
}
