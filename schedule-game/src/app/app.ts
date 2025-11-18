import { Component, inject, signal, viewChild } from '@angular/core';
import { Auth, signInAnonymously } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { JsonPipe } from '@angular/common';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JsonPipe],
  template: `
    <button (click)="test()">Run Firestore Test</button>
    <input type="text" #inp />
    <pre>{{ result() | json }}</pre>
  `,
})
export class App {
  private readonly auth = inject(Auth);
  private readonly db = inject(Firestore);
  result = signal<any>(null);

  async test() {
    const userCred = await signInAnonymously(this.auth);
    const uid = userCred.user.uid;

    const docRef = doc(this.db, 'users', uid);
    await setDoc(docRef, { test: 'Hello Firestore!', uid: uid });
    const docSnap = await getDoc(docRef);

    this.result.set(docSnap.data());
  }
}
