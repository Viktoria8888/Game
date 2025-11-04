import { Inject, Injectable, InjectionToken, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from '@angular/fire/firestore';
import { GameStateDTO } from '../models/game_state.dto';

export const COLLECTION_NAME = new InjectionToken<string>('collection name');
@Injectable({ providedIn: 'root' })
export class FirestoreService<T extends GameStateDTO> {
  private readonly db = inject(Firestore);
  private readonly collectionRef;

  constructor(@Inject(COLLECTION_NAME) private readonly collectionName: string) {
    this.collectionRef = collection(this.db, this.collectionName);
  }

  async get(userId: string): Promise<T | null> {
    const docRef = doc(this.collectionRef, userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  }

  async set(userId: string, data: T): Promise<void> {
    const docRef = doc(this.collectionRef, userId);
    await setDoc(docRef, data);
  }

  async update(userId: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.collectionRef, userId);
    await updateDoc(docRef, data as any);
  }

  async delete(userId: string): Promise<void> {
    const docRef = doc(this.collectionRef, userId);
    await deleteDoc(docRef);
  }

  subscribeToUser(userId: string, callback: (data: T | null) => void): () => void {
    const docRef = doc(this.collectionRef, userId);
    return onSnapshot(docRef, (snap) => {
      callback(snap.exists() ? (snap.data() as T) : null);
    });
  }
}
