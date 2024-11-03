import { inject, Injectable } from '@angular/core';
import { Auth, authState, inMemoryPersistence, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { browserLocalPersistence, setPersistence } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  auth: Auth = inject(Auth);
  user$ = user(this.auth);
  authState$ = authState(this.auth);

  async signIn(email: string, password: string, isRemember: boolean) {
    if (isRemember) {
      await setPersistence(this.auth, browserLocalPersistence);
    } else {
      await setPersistence(this.auth, inMemoryPersistence);
    }
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    console.log(userCredential);
  }

  async signOut() {
    await signOut(this.auth);
  }
}
