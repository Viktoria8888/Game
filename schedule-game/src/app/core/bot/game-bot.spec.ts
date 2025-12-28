import { TestBed } from '@angular/core/testing';

import { provideZonelessChangeDetection } from '@angular/core';
import { AutoSolverService } from '../services/auto-solver';
import { GameService } from '../services/game.service';
import { ScheduleService } from '../services/schedule.service';
import { CourseSelectionService } from '../services/courses-selection';
import { RulesService } from '../services/rules.service';

describe('AutoSolver Bot Integration', () => {
  let bot: AutoSolverService;
  let game: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AutoSolverService,
        GameService,
        ScheduleService,
        CourseSelectionService,
        RulesService,
      ],
    });

    bot = TestBed.inject(AutoSolverService);
    game = TestBed.inject(GameService);

    game.markAsInitialized();
  });

  it('should conquer the entire game (Level 1 to 5)', () => {
    let currentLevel = game.currentLevel();
    expect(currentLevel).toBe(1);

    while (currentLevel <= 5) {
      console.log(`\nSTARTING LEVEL ${currentLevel}`);

      const success = bot.solveCurrentLevel();

      if (!success) {
        fail(`Bot failed to find a solution for Level ${currentLevel}`);
        return;
      }

      const outcome = game.currentSemesterOutcome();
      expect(outcome.predictedTotalStress).toBeLessThan(100);

      console.log(
        `   Solved! Score Gain: ${outcome.scoreChange}, Stress: ${outcome.predictedTotalStress}%`
      );

      game.completeLevel();

      const nextLevel = game.currentLevel();
      expect(nextLevel).toBe(currentLevel + 1);

      currentLevel = nextLevel;
    }

    console.log('GAME COMPLETED ');
  });
});
