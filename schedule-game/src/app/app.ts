// src/app/app.ts
import { Component, inject, signal, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations'; //
import confetti from 'canvas-confetti'; //

import { ScheduleManagerComponent } from './core/components/schedule-manager/schedule-manager';
import { PersistenceService } from './core/services/persistence.service';
import { GameService } from './core/services/game.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ScheduleManagerComponent, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [
    // 1. The Container Animation (Stagger)
    trigger('victoryAnimation', [
      transition(':enter', [
        // Start with everything hidden
        query('div, h1, h2, p, button', [style({ opacity: 0, transform: 'translateY(20px)' })]),
        // Animate them in one by one with a 100ms delay between each
        query('div, h1, h2, p, button', [
          stagger(100, [
            animate(
              '500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'none' })
            ),
          ]),
        ]),
      ]),
    ]),
  ],
})
export class App {
  private readonly persistence = inject(PersistenceService);
  protected readonly gameService = inject(GameService);

  protected readonly percentile = signal<number | null>(null);

  constructor() {
    effect(async () => {
      if (this.gameService.isGameFinished()) {
        const p = await this.persistence.getScorePercentile(this.gameService.totalScore());
        this.percentile.set(p);

        // Trigger the cool confetti explosion!
        this.launchConfetti();
      }
    });
  }

  launchConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    // A loop to launch random confetti for 3 seconds
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff'], // Optional: customize colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }
}
