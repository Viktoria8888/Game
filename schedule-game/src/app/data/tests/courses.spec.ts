import { TestBed } from '@angular/core/testing';
import { Course } from '../../core/models/course.interface';
import { ValidationContext } from '../../core/models/rules.interface';
import { RulesService } from '../../core/services/rules.service';
import { SeededRNG, generateCourses, RESERVED_COURSES } from '../courses';
import { ValidationService } from '../../core/services/validation.service';
import { GameStateMetadata, SemesterHistory } from '../../core/models/game_state.dto';

describe('Golden Path Solvability', () => {
  let rulesService: RulesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RulesService, ValidationService],
    });
    rulesService = TestBed.inject(RulesService);
  });

  /**
   * Builds a mock context with sufficient history to pass "Academic Progress" rules.
   */
  function buildValidationContext(
    level: number,
    courses: Course[],
    previousEcts: number = 0
  ): ValidationContext {
    const history: SemesterHistory[] = [];
    if (previousEcts > 0) {
      history.push({
        level: level - 1,
        coursesTaken: ['HIST-DATA'],
        ectsEarned: previousEcts,
        scoreEarned: 1000,
        willpowerCost: 10,
      });
    }

    const currentSemesterEcts = courses.reduce((sum, c) => sum + c.ects, 0);
    const ectsByTag: Record<string, number> = {};
    const ectsByType: Record<string, number> = {};

    courses.forEach((c) => {
      c.tags.forEach((t) => (ectsByTag[t] = (ectsByTag[t] || 0) + c.ects));
      ectsByType[c.type] = (ectsByType[c.type] || 0) + c.ects;
    });

    const metadata: GameStateMetadata = {
      currentSemesterEcts,
      ectsByTag,
      ectsByType,
      hasExamCount: courses.filter((c) => c.hasExam).length,
      uniqueCoursesCount: new Set(courses.map((c) => c.subjectId)).size,
      proseminarCount: courses.filter((c) => c.isProseminar).length,
      mandatoryCoursesCompleted: courses.filter((c) => c.isMandatory).map((c) => c.subjectId),
      totalContactHours: courses.reduce((sum, c) => sum + c.schedule.durationHours, 0),
      totalGapTime: 0,
      maxGapInAnyDay: 0,
      averageStartTime: 9,
      freeDaysCount: 5 - new Set(courses.map((c) => c.schedule.day)).size,
      willpowerCost: 0,
      costBreakdown: [],
    };

    return {
      level,
      schedule: courses.map((c) => ({
        id: c.id,
        day: c.schedule.day,
        startTime: c.schedule.startTime,
        course: c,
      })),
      coursesSelected: courses,
      metadata,
      history,
    };
  }

  /**
   * Selects one group per component for `subjects` reserved for the level.
   */
  const getCoursesForLevel = (allCourses: Course[], level: number): Course[] => {
    return allCourses.filter((c) => RESERVED_COURSES[c.subjectId] === level && c.id.endsWith('-1'));
  };

  it('Level 3: Solvable via AI Golden Path', () => {
    const rng = new SeededRNG('my-stable-seed');
    const allCourses = generateCourses(rng);

    // AI/OS Rivalry
    const level3Courses = getCoursesForLevel(allCourses, 3).filter(
      (c) => c.subjectId !== '4084' && c.subjectId !== '4091'
    );

    const context = buildValidationContext(3, level3Courses, 60);
    const results = rulesService.validate(context);

    expect(rulesService.areRequiredRulesSatisfied(results))
      .withContext(results.violated.map((v) => v.result.message).join(', '))
      .toBeTrue();
  });

  it('Level 4: Solvable via Reserved Courses', () => {
    const rng = new SeededRNG('my-stable-seed');
    const allCourses = generateCourses(rng);

    const level4Courses = getCoursesForLevel(allCourses, 4);
    const context = buildValidationContext(4, level4Courses, 90);
    const results = rulesService.validate(context);

    expect(rulesService.areRequiredRulesSatisfied(results)).toBeTrue();
    expect(context.metadata.currentSemesterEcts).toBe(21); // Blackjack
  });

  it('Level 5: Solvable via Reserved Courses (Word Chain)', () => {
    const rng = new SeededRNG('my-stable-seed');
    const allCourses = generateCourses(rng);

    const level5Courses = getCoursesForLevel(allCourses, 5);
    const context = buildValidationContext(5, level5Courses, 105);
    const results = rulesService.validate(context);

    expect(rulesService.areRequiredRulesSatisfied(results))
      .withContext(results.violated.map((v) => v.result.message).join(', '))
      .toBeTrue();
  });

  it('Level 6: Solvable via Reserved Courses (Trifecta)', () => {
    const rng = new SeededRNG('my-stable-seed');
    const allCourses = generateCourses(rng);

    const level6Courses = getCoursesForLevel(allCourses, 6);
    const context = buildValidationContext(6, level6Courses, 150);
    const results = rulesService.validate(context);

    expect(rulesService.areRequiredRulesSatisfied(results)).toBeTrue();
    expect(context.metadata.uniqueCoursesCount).toBe(3); // Trifecta
    expect(context.metadata.totalContactHours).toBeLessThanOrEqual(13); // Ghost Mode
  });
});
