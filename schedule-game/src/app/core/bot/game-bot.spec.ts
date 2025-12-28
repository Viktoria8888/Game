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
  let selection: CourseSelectionService;

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
    selection = TestBed.inject(CourseSelectionService);

    game.markAsInitialized();
  });

  it('should conquer the entire game (Level 1 to 5) with retries', () => {
    let currentLevel = game.currentLevel();
    const TARGET_LEVEL = 5;
    const MAX_RETRIES_PER_LEVEL = 10;

    expect(currentLevel).toBe(1);

    while (currentLevel <= TARGET_LEVEL) {
      console.log(`\nSTARTING LEVEL ${currentLevel} 🏁`);

      let success = false;

      for (let attempt = 1; attempt <= MAX_RETRIES_PER_LEVEL; attempt++) {
        selection.clearAll();

        success = bot.solveCurrentLevel();

        if (success) {
          console.log(`Passed Level ${currentLevel} on attempt #${attempt}`);
          break;
        } else {
          console.warn(`Failed attempt #${attempt} for level ${currentLevel}`);
        }
      }

      if (!success) {
        fail(
          `Bot failed to find a solution for level ${currentLevel} after ${MAX_RETRIES_PER_LEVEL} macro-attempts.`
        );
        return;
      }

      const outcome = game.currentSemesterOutcome();
      expect(outcome.predictedTotalStress).toBeLessThan(100);

      console.log(
        `   Stats: Score +${outcome.scoreChange}, Stress ${outcome.predictedTotalStress}%`
      );

      game.completeLevel();

      const nextLevel = game.currentLevel();
      if (currentLevel < TARGET_LEVEL) {
        expect(nextLevel).toBe(currentLevel + 1);
      }

      currentLevel = nextLevel;
    }

    console.log('GAME COMPLETED');
  });
});
