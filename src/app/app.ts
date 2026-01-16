import { Component, inject, signal, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ScheduleManagerComponent } from './core/components/schedule-manager/schedule-manager';
import { PersistenceService } from './core/services/persistence.service';
import { GameService } from './core/services/game.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ScheduleManagerComponent, DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
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
      }
    });
  }
}
