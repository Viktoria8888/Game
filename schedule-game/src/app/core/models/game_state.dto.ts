import { ScheduleSlot } from './course.interface';

export interface GameStateMetadata {
  totalEctsAccumulated: number;
  //   totalEctsInformatics: number;
  //   totalEctsTools: number;
  //   totalEctsHumanities: number;
  //   totalEctsEconomics: number;
  //   totalEctsOWI: number;
  //   proseminarsCount: number;
  //   totalEctsPractical: number;
  //   requiredTagsMet: { [key: string]: boolean };
}

export interface GameStateDTO {
  currentSemester: number;
  slots: ScheduleSlot[];
  metadata: GameStateMetadata | null;
}
