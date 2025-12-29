import { Rule } from '../../core/models/rules.interface';
import {
  createMaxContactHoursRule,
  createMinFreeDaysRule,
  createTagBanRule,
  createCumulativeProgressRule,
  createNoGapsRule,
  getTotalEctsBySubject,
} from './common';

const THESIS_DEFENSE: Rule = {
  id: 'l6-thesis',
  title: 'Diploma Thesis',
  description: 'Register for a "Project" type course (The Thesis).',
  category: 'Mandatory',
  level: 6,
  priority: 200,
  scoreReward: 5000,
  stressModifier: 10,
  validate: (ctx) => {
    const hasThesis = ctx.coursesSelected.some((c) => c.type === 'Project');
    return {
      satisfied: hasThesis,
      severity: 'error',
      message: hasThesis
        ? 'Thesis registered. Good luck!'
        : 'You cannot graduate without a Thesis Project!',
    };
  },
};

const DEGREE_REQUIREMENT = createCumulativeProgressRule({ id: 'l6-degree', level: 6 }, 140);

const MANDATORY_INTERNSHIP = createMinFreeDaysRule(
  {
    id: 'l6-intern',
    level: 6,
    category: 'Mandatory', 
    title: 'Full-Time Job Offer',
    description: 'You have a job. Keep at least 3 days completely free for work.',
  },
  3
);


const TRIFECTA: Rule = {
  id: 'l6-trifecta',
  title: 'The Trifecta',
  description: 'Focus. Take exactly 3 courses this semester.',
  category: 'Mandatory',
  level: 6,
  scoreReward: 2000,
  stressModifier: -10,
  priority: 100,
  validate: (ctx) => {
    const count = new Set(ctx.coursesSelected.map((course) => course.subjectId)).size;
    return {
      satisfied: count === 3,
      message:
        count === 3
          ? 'Perfect focus (3 courses).'
          : `Too scattered! You have ${count} courses. Aim for exactly 3.`,
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
  scoreReward: 1500,
  stressModifier: -5,
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
  title: 'Briefing Mode',
  description: 'Keep it short. Course names must be shorter than 15 characters.',
  category: 'Goal',
  level: 6,
  scoreReward: 3000,
  stressModifier: -10,
  priority: 100,
  validate: (ctx) => {
    const violations = ctx.coursesSelected.filter((c) => c.name.length >= 15);
    return {
      satisfied: violations.length === 0 && ctx.coursesSelected.length > 0,
      message:
        violations.length === 0
          ? 'Briefing received. Short and sweet.'
          : `Too verbose: ${violations.map((c) => c.name).join(', ')}.`,
    };
  },
};

const GHOST_MODE = createMaxContactHoursRule(
  { id: 'l6-ghost', level: 6, category: 'Goal', scoreReward: 1000, stressModifier: -30 },
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
