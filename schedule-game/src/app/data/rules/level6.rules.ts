import { Rule } from '../../core/models/rules.interface';
import {
  createMaxContactHoursRule,
  createMinFreeDaysRule,
  createCumulativeProgressRule,
  getTotalEctsBySubject,
} from './common';

const THESIS_DEFENSE: Rule = {
  id: 'l6-thesis',
  title: 'The Final Boss',
  description: 'Register for Diploma Work course.',
  category: 'Mandatory',
  level: 6,
  priority: 200,
  scoreReward: 0,
  validate: (ctx) => {
    const hasThesis = ctx.coursesSelected.some((c) => c.type === 'Project');
    return {
      satisfied: hasThesis,
      severity: 'error',
      message: hasThesis
        ? 'Boss fight initiated. Good luck.'
        : 'You cannot beat the game without fighting the Final Boss (Thesis)!',
    };
  },
};

const DEGREE_REQUIREMENT = createCumulativeProgressRule(
  { id: 'l6-progress', level: 6, title: 'Progress: Not great, not terrible ' },
  120
);

const MANDATORY_INTERNSHIP = createMinFreeDaysRule(
  {
    id: 'l6-intern',
    level: 6,
    category: 'Mandatory',
    title: 'Corporate Sellout',
    description: 'Finally, you are not unemployed. Keep at least 3 days completely free for work.',
  },
  3
);

const TRIFECTA: Rule = {
  id: 'l6-trifecta',
  title: 'Minimalism',
  description: 'Your motivation is at 0%. You physically cannot handle more than 3 courses.',
  category: 'Mandatory',
  level: 6,
  priority: 100,
  validate: (ctx) => {
    const count = new Set(ctx.coursesSelected.map((course) => course.subjectId)).size;
    return {
      satisfied: count === 3,
      message:
        count === 3
          ? 'Maximum laziness achieved (3 courses).'
          : `Too much effort! You have ${count} courses. Aim for exactly 3.`,
    };
  },
};

const NO_FLUFF: Rule = {
  id: 'l6-no-fluff',
  title: 'No Fluff',
  description:
    'Do not waste time on small courses. Every subject must be worth at least 4 ECTS total.',
  category: 'Goal',
  level: 6,
  scoreReward: 350,
  priority: 100,
  validate: (ctx) => {
    const ectsBySubject = getTotalEctsBySubject(ctx);
    const violations: string[] = [];
    ectsBySubject.forEach((totalEcts, subjectId) => {
      if (totalEcts < 4) {
        const name = ctx.coursesSelected.find((c) => c.subjectId === subjectId)?.name || subjectId;
        violations.push(`${name} (${totalEcts} ECTS)`);
      }
    });

    return {
      satisfied: violations.length === 0 && ctx.coursesSelected.length > 0,
      message:
        violations.length === 0
          ? 'High-value schedule approved.'
          : `Remove filler subjects (<4 ECTS): ${violations.join(', ')}.`,
    };
  },
};
const BRIEFING_MODE: Rule = {
  id: 'l6-briefing',
  title: 'TL;DR',
  description: 'No time for this. Course names must be shorter than 15 characters.',
  category: 'Goal',
  level: 6,
  scoreReward: 350,
  priority: 100,
  validate: (ctx) => {
    const violations = ctx.coursesSelected.filter((c) => c.name.length >= 15);
    return {
      satisfied: violations.length === 0 && ctx.coursesSelected.length > 0,
      message:
        violations.length === 0
          ? 'Short and sweet.'
          : `I ain't reading all that: ${violations.map((c) => c.name).join(', ')}.`,
    };
  },
};

const GHOST_MODE = createMaxContactHoursRule(
  {
    id: 'l6-ghost',
    level: 6,
    category: 'Goal',
    scoreReward: 300,
    description: 'You are a myth on campus. Be seen for less than 13 hours a week.',
  },
  13
);

export const LEVEL_6_RULES = [
  THESIS_DEFENSE,
  DEGREE_REQUIREMENT,
  MANDATORY_INTERNSHIP,
  NO_FLUFF,
  TRIFECTA,
  BRIEFING_MODE,
  GHOST_MODE,
];
