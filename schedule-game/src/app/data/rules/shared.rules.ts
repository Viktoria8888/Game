import { Rule } from '../../core/models/rules.interface';
import { SUBJECTS } from '../subjects';
import { createMinEctsRule, createStandardLoadRule } from './common';
export const MIN_ECTS_RULE = createMinEctsRule('min-ects', 18, null, 'Mandatory');

export const PAIRING: Rule = {
  id: 'pairing',
  title: 'Incomplete Subjects',
  description: 'You must take all components of a subject.',
  category: 'Mandatory',
  level: null,
  priority: 300,
  validate: (context) => {
    const violations: string[] = [];
    const userMap = new Map<string, string[]>();

    context.coursesSelected.forEach((c) => {
      const subjectId = c.subjectId;

      if (!userMap.has(subjectId)) {
        userMap.set(subjectId, []);
      }
      userMap.get(subjectId)?.push(c.type);
    });

    for (const [subjectId, selectedTypes] of userMap) {
      const definition = SUBJECTS.find((s) => s.id === subjectId);
      const requiredTypes = definition?.components.map((c) => c.type);

      const uniqueSelected = new Set(selectedTypes);
      if (uniqueSelected.size !== selectedTypes.length) {
        violations.push(
          `${definition?.name}: You selected multiple groups for the same component!`
        );
        continue;
      }

      const missing = requiredTypes?.filter((req) => !uniqueSelected.has(req));

      if (missing!.length > 0) {
        violations.push(`${definition?.name}: Missing ${missing?.join(', ')}`);
      }
    }
    const isSatisfied = violations.length === 0 && context.coursesSelected.length > 0;

    return {
      satisfied: isSatisfied,
      message: !isSatisfied ? violations.join('; ') : 'Subjects are complete.',
    };
  },
};
// add implementation
// const SPEEDRUNNER: Rule = {
//   id: 'secret-speedrun',
//   title: '🏃 Speedrunner',
//   description: 'Complete level in under 2 minutes (hidden achievement).',
//   category: 'Goal',
//   level: null,
//   priority: 5,
//   scoreReward: 2000,
//   isActive: (ctx) => {
//     return ctx.metadata.achievementsUnlocked?.includes('Speedrunner');
//   },
//   validate: (ctx) => ({
//     satisfied: true,
//     message: 'Speedrun achievement unlocked! 🏆',
//   }),
// };

// const PERFECTIONIST: Rule = {
//   id: 'secret-perfect',
//   title: '💎 Perfectionist',
//   description: 'Satisfy ALL goal rules in current level.',
//   category: 'Goal',
//   level: null,
//   priority: 1,
//   scoreReward: 5000,
//   stressModifier: -100,
//   isActive: (ctx) => ctx.level >= 5,
//   validate: (ctx) => {
//     return {
//       satisfied: false,
//       message: 'Need to satisfy ALL goal rules.',
//     };
//   },
// };

export const GLOBAL_RULES: ReadonlyArray<Rule> = [PAIRING];
