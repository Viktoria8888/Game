import { Rule, ValidationContext } from '../../core/models/rules.interface';
import { LEVEL_1_RULES } from '../rules/level1.rules';
import { LEVEL_2_RULES } from '../rules/level2.rules';
import { LEVEL_3_RULES } from '../rules/level3.rules';
import { LEVEL_4_RULES } from '../rules/level4.rules';
import { LEVEL_5_RULES } from '../rules/level5.rules';
import { LEVEL_6_RULES } from '../rules/level6.rules';

describe('Unit Tests: All Level Rules', () => {
  const getRule = (rules: ReadonlyArray<Rule>, id: string) => rules.find((r) => r.id === id);
  const createMockContext = (overrides: Partial<ValidationContext> = {}): ValidationContext => {
    return {
      level: 1,
      history: [],
      schedule: [],
      coursesSelected: [],
      metadata: {
        currentSemesterEcts: 0,
        ectsByTag: {},
        ectsByType: {},
        hasExamCount: 0,
        uniqueCoursesCount: 0,
        proseminarCount: 0,
        mandatoryCoursesCompleted: [],
        totalContactHours: 0,
        totalGapTime: 0,
        maxGapInAnyDay: 0,
        averageStartTime: 0,
        freeDaysCount: 0,
        willpowerCost: 0,
        costBreakdown: [],
      },
      ...overrides,
    } as ValidationContext;
  };

  describe('Level 1: Fundamentals', () => {
    it('l1-no-advanced: should block the ADVANCED tag', () => {
      const rule = getRule(LEVEL_1_RULES, 'l1-no-advanced')!;
      const ctx = createMockContext({
        coursesSelected: [{ tags: ['ADVANCED'], name: 'Pro Course' } as any],
      });

      expect(rule.validate(ctx).satisfied).toBeFalse();
    });

    it('l1-names: course names must have at least 10 characters', () => {
      const rule = getRule(LEVEL_1_RULES, 'l1-names')!;
      const ctx = createMockContext({
        coursesSelected: [{ name: 'Short' } as any],
      });

      expect(rule.validate(ctx).satisfied).toBeFalse();
    });
  });

  describe('Level 2: Time Constraints', () => {
    it('l2-sleep: error if classes start before 10:00', () => {
      const rule = getRule(LEVEL_2_RULES, 'l2-sleep')!;
      const ctx = createMockContext({
        schedule: [{ startTime: 8, day: 'Mon' } as any],
      });

      expect(rule.validate(ctx).satisfied).toBeFalse();
    });

    it('l2-lunch: error if classes are scheduled between 13:00 and 14:00', () => {
      const rule = getRule(LEVEL_2_RULES, 'l2-lunch')!;
      const ctx = createMockContext({
        schedule: [{ startTime: 13, day: 'Tue' } as any],
      });

      expect(rule.validate(ctx).satisfied).toBeFalse();
    });
  });

  describe('Level 3: Logic and Synergy', () => {
    it('l3-stair: detects staircase error (Tuesday earlier than Monday)', () => {
      const rule = getRule(LEVEL_3_RULES, 'l3-stair')!;
      const ctx = createMockContext({
        schedule: [
          { day: 'Mon', startTime: 10, course: {} } as any,
          { day: 'Tue', startTime: 9, course: {} } as any,
        ],
      });

      expect(rule.validate(ctx).satisfied).toBeFalse();
    });

    it('l3-synergy: AI requires subjects with the STATS tag', () => {
      const rule = getRule(LEVEL_3_RULES, 'l3-synergy')!;
      const ctx = createMockContext({
        coursesSelected: [{ tags: ['AI'] } as any],
      });

      expect(rule.validate(ctx).satisfied).toBeFalse();
    });
  });

  describe('Level 4: Optimization Challenges', () => {
    it('l4-blackjack: total ECTS must be exactly 21', () => {
      const rule = getRule(LEVEL_4_RULES, 'l4-blackjack')!;

      expect(
        rule.validate(createMockContext({ metadata: { currentSemesterEcts: 21 } as any })).satisfied
      ).toBeTrue();
      expect(
        rule.validate(createMockContext({ metadata: { currentSemesterEcts: 22 } as any })).satisfied
      ).toBeFalse();
    });

    it('l4-odd: classes must start at an odd hour', () => {
      const rule = getRule(LEVEL_4_RULES, 'l4-odd')!;
      const ctx = createMockContext({
        coursesSelected: [{ schedule: { startTime: 10 } } as any],
      });

      expect(rule.validate(ctx).satisfied).toBeFalse();
    });
  });

  describe('Level 5: Style and Text', () => {
    it('l5-chain: verifies name chain (last letter = first letter of next)', () => {
      const rule = getRule(LEVEL_5_RULES, 'l5-chain')!;
      const ctx = createMockContext({
        schedule: [
          { day: 'Mon', startTime: 10, course: { subjectId: '1', name: 'AnalysiS' } } as any,
          { day: 'Tue', startTime: 10, course: { subjectId: '2', name: 'SoftwarE' } } as any,
        ],
      });

      expect(rule.validate(ctx).satisfied).toBeTrue();
    });

    it('l5-no-numbers: forbids digits in course names', () => {
      const rule = getRule(LEVEL_5_RULES, 'l5-no-numbers')!;
      const ctx = createMockContext({
        coursesSelected: [{ name: 'Databases 2' } as any],
      });

      expect(rule.validate(ctx).satisfied).toBeFalse();
    });

    it('l5-alliteration: requires at least 3 subjects starting with the same letter', () => {
      const rule = getRule(LEVEL_5_RULES, 'l5-alliteration')!;

      // Satisfied Case: 3 subjects starting with 'A'
      const validCtx = createMockContext({
        coursesSelected: [
          { name: 'Algorithms' },
          { name: 'Architecture' },
          { name: 'Artificial Intelligence' },
        ] as any,
      });

      const resultValid = rule.validate(validCtx);
      expect(resultValid.satisfied).toBeTrue();
      expect(resultValid.message).toContain('Beautiful alliteration');

      // Failed Case: Only 2 subjects starting with 'A'
      const invalidCtx = createMockContext({
        coursesSelected: [
          { name: 'Algorithms' },
          { name: 'Architecture' },
          { name: 'Biology' },
        ] as any,
      });

      const resultInvalid = rule.validate(invalidCtx);
      expect(resultInvalid.satisfied).toBeFalse();
    });
  });

  describe('Level 6: Graduation', () => {
    it('l6-trifecta: requires selecting exactly 3 unique subjects', () => {
      const rule = getRule(LEVEL_6_RULES, 'l6-trifecta')!;
      const ctx = createMockContext({
        coursesSelected: [{ subjectId: 'S1' }, { subjectId: 'S2' }, { subjectId: 'S3' }] as any,
      });

      expect(rule.validate(ctx).satisfied).toBeTrue();
    });

    it('l6-no-fluff: each subject must have at least 4 ECTS', () => {
      const rule = getRule(LEVEL_6_RULES, 'l6-no-fluff')!;
      const ctx = createMockContext({
        coursesSelected: [{ subjectId: 'S1', ects: 3, name: 'Small Course' } as any],
      });

      expect(rule.validate(ctx).satisfied).toBeFalse();
    });

    it('l6-ghost: error if contact hours exceed 13h', () => {
      const rule = getRule(LEVEL_6_RULES, 'l6-ghost')!;
      const ctx = createMockContext({
        metadata: { totalContactHours: 14 } as any,
      });

      expect(rule.validate(ctx).satisfied).toBeFalse();
    });
  });
});
