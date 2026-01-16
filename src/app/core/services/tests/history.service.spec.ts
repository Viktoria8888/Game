import { TestBed } from '@angular/core/testing';

import { HistoryService } from '../history.service';
import { provideZonelessChangeDetection } from '@angular/core';
import { SemesterHistory } from '../../models/game_state.dto';

const MOCK_SEMESTER_1: SemesterHistory = {
  level: 1,
  coursesTaken: [],
  ectsEarned: 10,
  scoreEarned: 50,
  willpowerCost: 10,
};
const MOCK_SEMESTER_2: SemesterHistory = {
  level: 2,
  coursesTaken: [],
  ectsEarned: 30,
  scoreEarned: 50,
  willpowerCost: 4,
};

describe('HistoryService', () => {
  let service: HistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(HistoryService);
  });

  it('is created with empty selection', () => {
    expect(service.history()).toEqual([]);
    expect(service.totalHistoricalEcts()).toBe(0);
    expect(service.totalHistoricalScore()).toBe(0);
  });

  it('adds a record and update computed signals', () => {
    service.addRecord(MOCK_SEMESTER_1);

    expect(service.history().length).toBe(1);
    expect(service.history()[0]).toBe(MOCK_SEMESTER_1);
    expect(service.totalHistoricalEcts()).toBe(10);
    expect(service.totalHistoricalScore()).toBe(50);
  });

  it('accumulates totals correctly when multiple records are added', () => {
    service.addRecord(MOCK_SEMESTER_1);
    service.addRecord(MOCK_SEMESTER_2);

    expect(service.totalHistoricalEcts()).toBe(40);
    expect(service.totalHistoricalScore()).toBe(100);
  });

  it('overwrites existing history using setHistory', () => {
    service.addRecord(MOCK_SEMESTER_1);

    const newHistory = [MOCK_SEMESTER_2, MOCK_SEMESTER_2];
    service.setHistory(newHistory);

    expect(service.history().length).toBe(2);
    expect(service.history()).toEqual(newHistory);
    expect(service.totalHistoricalEcts()).toBe(60);
  });

  it('clears history and reset computed signals to zero', () => {
    service.addRecord(MOCK_SEMESTER_1);
    service.addRecord(MOCK_SEMESTER_2);

    service.clear();

    expect(service.history().length).toBe(0);
    expect(service.totalHistoricalEcts()).toBe(0);
    expect(service.totalHistoricalScore()).toBe(0);
  });
});
