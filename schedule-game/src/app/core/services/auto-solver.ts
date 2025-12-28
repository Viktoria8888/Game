import { Injectable, inject } from '@angular/core';
import { GameService } from './game.service';
import { CourseSelectionService } from './courses-selection';
import { RulesService } from './rules.service';
import { ScheduleService } from './schedule.service';
import { COURSES } from '../../data/courses';
import { Course } from '../models/course.interface';
import { ValidationContext } from '../models/rules.interface';

@Injectable({ providedIn: 'root' })
export class AutoSolverService {
  private game = inject(GameService);
  private selection = inject(CourseSelectionService);
  private rules = inject(RulesService);
  private schedule = inject(ScheduleService);

  private readonly MAX_ATTEMPTS = 5000;

  solveCurrentLevel(): boolean {
    const level = this.game.currentLevel();
    console.log(`BOT: Solving Level ${level}...`);

    const history = this.game.history.history();
    const takenIds = new Set(history.flatMap((h) => h.coursesTaken));
    const pastTotalEcts = history.reduce((sum, h) => sum + h.ectsEarned, 0);

    const contextStub = { level } as ValidationContext;
    const activeRules = this.rules['getActiveRules'](contextStub);

    const mandatorySubjectIds = new Set<string>();
    const bannedTags = new Set<string>();
    const requiredTags = new Set<string>();
    const tagSpecialists: { tag: string; minEcts: number }[] = [];
    const bannedDays = new Set<string>();
    const mutualExclusions: [string, string][] = [];
    const bannedTimeSlots = new Set<number>();
    const tagSynergies: { primary: string; required: string }[] = [];


    let targetEcts = 22;
    let minNameLength = 0;
    let oddHoursOnly = false;
    let maxContactHours = 999;
    let minStartHour = 0;
    let maxDailyHours = 99;
    let forcePrimeEcts = false;
    let forcePalindromeHours = false;
    let minFreeDays = 0;

    activeRules.forEach((r) => {
      if (!r.solverHint) return;
      const h = r.solverHint;

      switch (h.type) {
        case 'REQUIRED_SUBJECTS':
          h.value.forEach((subId) => {
            if (!takenIds.has(subId)) {
              mandatorySubjectIds.add(subId);
            }
          });
          break;
        case 'MIN_ECTS':
          targetEcts = Math.max(targetEcts, h.value);
          break;
        case 'MIN_TOTAL_ECTS':
          targetEcts = Math.max(targetEcts, h.value - pastTotalEcts);
          break;
        case 'BAN_TAG':
          bannedTags.add(h.value);
          break;
        case 'TAG_REQUIREMENT':
          requiredTags.add(h.value);
          break;
        case 'TAG_SPECIALIST':
          tagSpecialists.push(h.value);
          break;
        case 'TAG_SYNERGY':
          tagSynergies.push(h.value);
          break;
        case 'NAME_LENGTH':
          minNameLength = Math.max(minNameLength, h.value);
          break;
        case 'MUTUALLY_EXCLUSIVE_TAGS':
          mutualExclusions.push(h.value);
          break;
        case 'ODD_HOURS':
          if (r.category == 'Mandatory') oddHoursOnly = h.value;
          break;
        case 'MAX_CONTACT_HOURS':
          maxContactHours = h.value;
          break;
        case 'BAN_TIME_SLOTS':
          h.value.forEach((t) => bannedTimeSlots.add(t));
          break;
        case 'MIN_START_HOUR':
          minStartHour = Math.max(minStartHour, h.value);
          break;
        case 'MAX_DAILY_HOURS':
          maxDailyHours = h.value;
          break;
        case 'BAN_DAYS':
          h.value.forEach((d) => bannedDays.add(d));
          break;
        case 'FORCE_PRIME_ECTS':
          forcePrimeEcts = h.value;
          break;
        case 'FORCE_PALINDROME_HOURS':
          forcePalindromeHours = h.value;
          break;
        case 'MIN_FREE_DAYS':
          minFreeDays = h.value;
          break;
      }
    });

    const validPool = COURSES.filter((c) => {
      if (takenIds.has(c.id)) return false;
      if (c.prerequisites?.some((req) => !takenIds.has(req))) return false;
      if (c.tags?.some((t) => bannedTags.has(t))) return false;
      if (c.name.length < minNameLength) return false;
      if (c.schedule.startTime < minStartHour) return false;
      if (bannedDays.has(c.schedule.day)) return false;

      for (let h = 0; h < c.schedule.durationHours; h++) {
        if (bannedTimeSlots.has(c.schedule.startTime + h)) return false;
      }

      if (oddHoursOnly && c.schedule.startTime % 2 === 0) return false;

      return true;
    });

    const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    for (let i = 0; i < this.MAX_ATTEMPTS; i++) {
      this.selection.clearAll();

      let attemptBannedDays = new Set<string>();
      if (minFreeDays > 0) {
        const shuffledDays = [...ALL_DAYS].sort(() => Math.random() - 0.5);
        for (let k = 0; k < minFreeDays; k++) {
          attemptBannedDays.add(shuffledDays[k]);
        }
      }

      try {
        if (mandatorySubjectIds.size > 0) {
          const mandatoryCourses = validPool.filter((c) => mandatorySubjectIds.has(c.subjectId));
          this.fillRandomly(
            mandatoryCourses,
            999,
            maxContactHours,
            mutualExclusions,
            tagSynergies,
            validPool,
            undefined,
            attemptBannedDays 
          );
        }

        for (const tag of requiredTags) {
          if (!this.hasTagSelected(tag)) {
            const tagPool = validPool.filter((c) => c.tags?.includes(tag as any));
            this.addOneRandomly(
              tagPool,
              maxContactHours,
              mutualExclusions,
              tagSynergies,
              validPool,
              attemptBannedDays
            );
          }
        }

        for (const spec of tagSpecialists) {
          const specPool = validPool.filter((c) => c.tags?.includes(spec.tag as any));
          this.fillRandomly(
            specPool,
            999,
            maxContactHours,
            mutualExclusions,
            tagSynergies,
            validPool,
            () => this.getEctsForTag(spec.tag) >= spec.minEcts,
            attemptBannedDays
          );
        }

        for (const syn of tagSynergies) {
          if (this.hasTagSelected(syn.primary) && !this.hasTagSelected(syn.required)) {
            const fixPool = validPool.filter((c) => c.tags?.includes(syn.required as any));
            this.addOneRandomly(
              fixPool,
              maxContactHours,
              mutualExclusions,
              tagSynergies,
              validPool,
              attemptBannedDays
            );
          }
        }

        this.fillRandomly(
          validPool,
          targetEcts,
          maxContactHours,
          mutualExclusions,
          tagSynergies,
          validPool,
          undefined,
          attemptBannedDays 
        );

        const outcome = this.game.currentSemesterOutcome();
        const passed = this.rules.areRequiredRulesSatisfied(outcome.validation);
        const stressOk = outcome.predictedTotalStress < 100;

        let goalsMet = true;
        if (forcePrimeEcts) {
          const n = this.schedule.simpleMetadata().currentSemesterEcts;
          if (!this.isPrime(n)) goalsMet = false;
        }
        if (forcePalindromeHours) {
          const h = this.schedule.complexMetadata().totalContactHours;
          const isPal = h.toString() === h.toString().split('').reverse().join('');
          if (!isPal) goalsMet = false;
        }

        if (passed && stressOk) {
          if (goalsMet || i > this.MAX_ATTEMPTS * 0.9) {
            console.log(`BOT: Solution found in attempt ${i + 1}`);
            return true;
          }
        }
      } catch (e) {}
    }

    console.error('BOT: Failed to find solution.');
    return false;
  }


  private fillRandomly(
    pool: Course[],
    globalEctsLimit: number,
    maxContactHours: number,
    mutualExclusions: [string, string][],
    synergies: { primary: string; required: string }[],
    fullPool: Course[],
    customStopCondition?: () => boolean,
    attemptBannedDays?: Set<string> 
  ) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    for (const course of shuffled) {
      if (this.schedule.simpleMetadata().currentSemesterEcts >= globalEctsLimit) break;
      if (this.schedule.complexMetadata().totalContactHours >= maxContactHours) break;
      if (customStopCondition && customStopCondition()) break;

      if (attemptBannedDays && attemptBannedDays.has(course.schedule.day)) continue;

      const currentSelection = this.selection.selectedCourses();

      if (currentSelection.some((c) => c.subjectId === course.subjectId && c.type === course.type))
        continue;

      const violatesExclusion = mutualExclusions.some(([tagA, tagB]) => {
        const hasA = currentSelection.some((s) => s.tags?.includes(tagA as any));
        const hasB = currentSelection.some((s) => s.tags?.includes(tagB as any));
        const isA = course.tags?.includes(tagA as any);
        const isB = course.tags?.includes(tagB as any);
        return (hasA && isB) || (hasB && isA);
      });
      if (violatesExclusion) continue;

      let partnerCourse: Course | null = null;
      const triggeredSynergy = synergies.find((s) => course.tags?.includes(s.primary as any));

      if (triggeredSynergy) {
        const alreadyHasRequired = this.hasTagSelected(triggeredSynergy.required);
        if (!alreadyHasRequired) {
          const possiblePartners = fullPool.filter(
            (c) =>
              c.tags?.includes(triggeredSynergy.required as any) &&
              !currentSelection.some((sel) => sel.id === c.id) &&
              (!attemptBannedDays || !attemptBannedDays.has(c.schedule.day)) 
          );

          const shuffledPartners = possiblePartners.sort(() => Math.random() - 0.5);

          partnerCourse =
            shuffledPartners.find((p) => {
              const canAddPartner = this.selection.canAddCourse(p);
              if (!canAddPartner.canAdd) return false;
              return !this.coursesCollide(course, p);
            }) || null;

          if (!partnerCourse) continue;
        }
      }

      try {
        const canAdd = this.selection.canAddCourse(course);
        if (canAdd.canAdd) {
          this.selection.addCourse(course);
          if (partnerCourse) {
            this.selection.addCourse(partnerCourse);
          }
        }
      } catch (e) {}
    }
  }

  private addOneRandomly(
    pool: Course[],
    maxHours: number,
    exclusions: [string, string][],
    synergies: { primary: string; required: string }[],
    fullPool: Course[],
    attemptBannedDays?: Set<string>
  ) {
    if (pool.length === 0) return;
    this.fillRandomly(
      pool,
      999,
      maxHours,
      exclusions,
      synergies,
      fullPool,
      () => true,
      attemptBannedDays
    );
  }

  private hasTagSelected(tag: string): boolean {
    return this.selection.selectedCourses().some((c) => c.tags?.includes(tag as any));
  }

  private getEctsForTag(tag: string): number {
    return this.selection
      .selectedCourses()
      .filter((c) => c.tags?.includes(tag as any))
      .reduce((sum, c) => sum + c.ects, 0);
  }

  private isPrime(num: number): boolean {
    if (num < 2) return false;
    for (let i = 2, s = Math.sqrt(num); i <= s; i++) if (num % i === 0) return false;
    return true;
  }

  private coursesCollide(c1: Course, c2: Course): boolean {
    if (c1.schedule.day !== c2.schedule.day) return false;
    const start1 = c1.schedule.startTime;
    const end1 = start1 + c1.schedule.durationHours;
    const start2 = c2.schedule.startTime;
    const end2 = start2 + c2.schedule.durationHours;
    return start1 < end2 && start2 < end1;
  }
}