import { Rule } from '../../core/models/rules.interface';
import { createCumulativeProgressRule, createTagSpecialistRule } from './common';

const THESIS_DEFENSE: Rule = {
  id: 'l7-thesis',
  title: 'Diploma Thesis',
  description: 'Register for a "Project" type course (The Thesis).',
  category: 'Mandatory',
  level: 7,
  priority: 200,
  scoreReward: 500,
  stressModifier: 10,
  validate: (ctx) => {
    const hasThesis = ctx.coursesSelected.some((c) => c.type === 'Project');
    return {
      satisfied: hasThesis,
      severity: 'error',
      message: hasThesis ? 'Thesis registered.' : 'No Thesis Project found!',
    };
  },
};

const EXACT_LOAD: Rule = {
  id: 'l7-30ects',
  title: 'Perfect Semester',
  description: 'Exactly 30 ECTS required.',
  category: 'Mandatory',
  level: 7,
  priority: 150,
  validate: (ctx) => {
    const current = ctx.metadata.currentSemesterEcts;
    return {
      satisfied: current === 30,
      severity: 'error',
      message: current === 30 ? 'Perfect.' : `Invalid ECTS: ${current}/30.`,
    };
  },
};

const NUMEROLOGY: Rule = {
  id: 'l7-numerology',
  title: 'Numerology',
  description: 'Total character count of course names must be divisible by 10.',
  category: 'Goal',
  level: 7,
  priority: 60,
  scoreReward: 3000,
  stressModifier: 10,
  validate: (ctx) => {
    const len = ctx.coursesSelected.reduce((sum, c) => sum + c.name.trim().length, 0);
    const rem = len % 10;
    return {
      satisfied: rem === 0 && len > 0,
      message:
        rem === 0 ? `Cosmic alignment (${len}).` : `Length ${len} (Remainder ${rem}). Fix it.`,
    };
  },
};

const MINIMAL_STRESS: Rule = {
  id: 'l7-zen',
  title: 'Zen Master',
  description: 'Keep predicted stress below 15 this semester.',
  category: 'Goal',
  level: 7,
  priority: 40,
  scoreReward: 5000,
  stressModifier: -100,
  validate: (ctx) => {
    const stress = ctx.metadata.stressLevel;
    return {
      satisfied: stress < 15,
      message: stress < 15 ? 'Stress managed perfectly! 🧘' : `${stress} stress is too high.`,
    };
  },
};
const DEGREE_REQUIREMENT = createCumulativeProgressRule('l7-degree', 154, 7);
export const LEVEL_7_RULES = [
  THESIS_DEFENSE,
  EXACT_LOAD,
  NUMEROLOGY,
  MINIMAL_STRESS,
  DEGREE_REQUIREMENT,
];
