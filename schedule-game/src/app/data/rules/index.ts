import { Rule } from '../../core/models/rules.interface';
import { SUBJECTS } from '../subjects';
import { LEVEL_1_RULES } from './level1.rules';
import { LEVEL_2_RULES } from './level2.rules';
import { LEVEL_3_RULES } from './level3.rules';
import { LEVEL_4_RULES } from './level4.rules';
import { LEVEL_5_RULES } from './level5.rules';
import { LEVEL_6_RULES } from './level6.rules';

export const PAIRING: Rule = {
  id: 'pairing',
  title: "Very sad 😔 Some subjects don't have their pair!",
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

export const GLOBAL_RULES: ReadonlyArray<Rule> = [PAIRING];

export const ALL_GAME_RULES: ReadonlyArray<Rule> = [
  ...GLOBAL_RULES,
  ...LEVEL_1_RULES,
  ...LEVEL_2_RULES,
  ...LEVEL_3_RULES,
  ...LEVEL_4_RULES,
  ...LEVEL_5_RULES,
  ...LEVEL_6_RULES,
];
