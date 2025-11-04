import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  signInAnonymously,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  readonly user = signal<User | null>(null);

  constructor() {
    onAuthStateChanged(this.auth, (firebaseUser) => {
      this.user.set(firebaseUser);
    });
  }
  async signInAnonymously(): Promise<void> {
    await signInAnonymously(this.auth);
  }

  async signUp(email: string, password: string) {
    await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async login(email: string, password: string) {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    await signOut(this.auth);
  }

  get userId(): string | null {
    return this.user()?.uid ?? null;
  }
  // add upgrading to the permanent user after signing-in anonymously
}
