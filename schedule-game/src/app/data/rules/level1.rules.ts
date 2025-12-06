import { Rule, ValidationContext } from '../../core/models/rules.interface';

const createMinEctsRule = (id: string, minEcts: number, level: number | null = null): Rule => {
  return {
    id,
    title: 'Minimum Ects',
    description: `Minimum ${minEcts} ECTS required per semester`,
    category: 'Cumulative',
    level,
    priority: 1,

    validate: (context: ValidationContext) => {
      const current = context.metadata.currentSemesterEcts;
      const satisfied = current >= minEcts;

      return {
        satisfied,
        severity: 'error',
        message: satisfied
          ? `You have ${current} ECTS (need ${minEcts})`
          : `You need ${minEcts - current} more ECTS (${current}/${minEcts})`,
        details: {
          currentVal: current,
          requiredVal: minEcts,
        },
      };
    },
  };
};

const createMaxEctsRule = (id: string, maxEcts: number, level: number | null = null): Rule => {
  return {
    id,
    title: 'Maximum Ects',
    description: `Maximum ${maxEcts} ECTS required per semester`,
    category: 'Cumulative',
    level: 2,
    priority: 1,

    validate: (context: ValidationContext) => {
      const current = context.metadata.currentSemesterEcts;
      const satisfied = current <= maxEcts;

      return {
        satisfied,
        severity: 'error',
        message: satisfied
          ? `You have ${current} ECTS (need ${maxEcts})`
          : `You need ${maxEcts - current} more ECTS (${current}/${maxEcts})`,
        details: {
          currentVal: current,
          requiredVal: maxEcts,
        },
      };
    },
  };
};
export const R1 = createMinEctsRule('r1', 18);
export const R2 = createMaxEctsRule('r2', 35);
export const RULES: ReadonlyArray<Rule> = [R1, R2];
