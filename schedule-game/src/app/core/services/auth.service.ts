import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  signInAnonymously,
  EmailAuthProvider,
  linkWithCredential,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  readonly user = signal<User | null>(null);
  readonly isAuthLoaded = signal(false); // test race condition
  readonly isAnonymous = computed(() => this.user()?.isAnonymous ?? false);

  readonly username = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return 'Guest';

    if (currentUser.displayName) {
      return currentUser.displayName;
    }
    if (currentUser.email) {
      return currentUser.email.split('@')[0];
    }
    if (currentUser.isAnonymous) {
      return `Player${currentUser.uid.slice(0, 4)}`;
    }
    return 'Player';
  });

  constructor() {
    onAuthStateChanged(this.auth, (firebaseUser) => {
      this.user.set(firebaseUser);
      this.isAuthLoaded.set(true);
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

  async upgradeToPermanent(email: string, password: string) {
    const currentUser = this.user();
    if (!currentUser) throw new Error('No user to upgrade'); // TEST IT !!!

    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(currentUser, credential);
  }
}
