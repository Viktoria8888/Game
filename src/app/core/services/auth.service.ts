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
  GoogleAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  readonly user = signal<User | null>(null, { equal: (a, b) => false });
  readonly isAuthLoaded = signal(false); //
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

  async upgradeToPermanent(email: string, password: string) {
    const currentUser = this.user();
    if (!currentUser) throw new Error('No user to upgrade');

    const credential = EmailAuthProvider.credential(email, password);
    const result = await linkWithCredential(currentUser, credential);
    this.user.set(result.user);
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (error) {
      console.error('Error with logging in using Google:', error);
      throw error;
    }
  }
}
