import { Rule } from '../../core/models/rules.interface';
import { SUBJECTS } from '../subjects';

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

export const GLOBAL_RULES: ReadonlyArray<Rule> = [PAIRING];
