import { Rule, ValidationContext } from '../../core/models/rules.interface';
import { COURSES } from '../courses';
import { createMaxEctsRule, createMinEctsRule } from './common';
export const MIN_ECTS_RULE = createMinEctsRule('min-ects', 18, null, 'Mandatory');

export const R3_PAIRING: Rule = {
  id: 'generic-pairing',
  title: 'Incomplete Subjects',
  description: 'You must take all components of a subject (e.g., Lecture + Lab).',
  category: 'Mandatory',
  level: null,
  priority: 10,

  validate: (context) => {
    const selectedIds = new Set(context.coursesSelected.map((c) => c.id));
    const violations: string[] = [];

    const allGroups = new Map<string, string[]>();
    COURSES.forEach((course) => {
      if (!allGroups.has(course.subjectId)) allGroups.set(course.subjectId, []);
      allGroups.get(course.subjectId)!.push(course.id);
    });

    const checkedSubjects = new Set<string>();

    context.coursesSelected.forEach((course) => {
      const subjectId = course.subjectId;

      if (checkedSubjects.has(subjectId)) return;
      checkedSubjects.add(subjectId);

      const requiredIds = allGroups.get(subjectId) || [];

      const missingComponents = requiredIds.filter((reqId) => !selectedIds.has(reqId));

      if (missingComponents.length > 0) {
        const missingTypes = COURSES.filter((c) => missingComponents.includes(c.id))
          .map((c) => c.type)
          .join(' + ');

        violations.push(`${course.name} (Missing: ${missingTypes})`);
      }
    });

    return {
      satisfied: violations.length === 0 && selectedIds.size > 0,
      severity: 'error',
      message:
        violations.length === 0
          ? 'All subjects are fully complete.'
          : `Incomplete subjects: ${violations.join(', ')}`,
    };
  },
};
export const GLOBAL_RULES: ReadonlyArray<Rule> = [R3_PAIRING];
