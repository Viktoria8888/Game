import { Injectable, inject, Inject, InjectionToken } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  DocumentReference,
} from '@angular/fire/firestore';
import { GameStateDTO } from '../models/game_state.dto';
import { UpdateData } from 'firebase/firestore';

export const COLLECTION_NAME = new InjectionToken<string>('COLLECTION_NAME');

@Injectable({ providedIn: 'root' })
export class FirestoreService<T extends GameStateDTO> {
  private readonly collectionRef;
  constructor(@Inject(COLLECTION_NAME) private readonly collectionName: string) {
    this.collectionRef = collection(this.db, collectionName);
  }
  private readonly db = inject(Firestore);

  async addData(userId: string, data: T): Promise<void> {
    const docRef = doc(this.collectionRef, userId);
    await setDoc(docRef, data);
  }

  async getData(userId: string): Promise<T | null> {
    const docRef = doc(this.collectionRef, userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  }

  async updateData(userId: string, data: Partial<T>): Promise<void> {
    const docRef = doc(this.collectionRef, userId) as DocumentReference<T, T>;
    await updateDoc(docRef, data as UpdateData<T>);
  }

  async deleteData(userId: string): Promise<void> {
    const docRef = doc(this.collectionRef, userId);
    await deleteDoc(docRef);
  }

  subscribeToUser(userId: string, onChange: (data: T | null) => void): () => void {
    const docRef = doc(this.collectionRef, userId);
    return onSnapshot(docRef, (snapshot) => {
      onChange(snapshot.exists() ? (snapshot.data() as T) : null);
    });
  }
}
