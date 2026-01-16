import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isMuted = false;

  constructor() {
    this.loadSound('collisions', 'sounds/collisions.wav');
    this.loadSound('add', 'sounds/add.wav');
    this.loadSound('delete', 'sounds/delete.wav');
    this.loadSound('typing', 'sounds/typing.wav');
    this.loadSound('tab', 'sounds/tab.wav');
    this.loadSound('success', 'sounds/success.wav');
  }

  private loadSound(key: string, path: string) {
    const audio = new Audio(path);
    audio.load();
    this.sounds.set(key, audio);
  }

  play(key: 'add' | 'collisions' | 'delete' | 'success'  | 'tab') {
    if (this.isMuted) return;
    const audio = this.sounds.get(key);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch((err) => console.error('Audio play failed', err));
    }
    // Decide to remove the sounds
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
  }
}
