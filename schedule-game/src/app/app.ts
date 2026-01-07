// src/app/app.ts
import { Component, inject } from '@angular/core';
import { ScheduleManagerComponent } from './core/components/schedule-manager/schedule-manager';
import { PersistenceService } from './core/services/persistence.service';
import { GameService } from './core/services/game.service';
import { LevelSummary } from './core/components/level-summary/level-summary';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ScheduleManagerComponent, LevelSummary],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly persistence = inject(PersistenceService);
  protected readonly gameService = inject(GameService);
}
