import { describe, it, expect } from 'vitest';
import {
  calculatePoints,
  calculateTeamScore,
  calculatePercentage,
  calculatePercentageNumber,
  validatePlayerStats,
  validateJerseyUniqueness,
  applyQuarterScoreDelta,
  calculateTopPerformers,
  determineResult,
  calculateTeamTotals,
  type PlayerStats,
  type QuarterScores,
} from './stats';

describe('stats.ts engine tests', () => {
  describe('PTS and Team Score', () => {
    it('calculates Vivaan Rao case correctly: FGM 2, 3PM 1, FTM 0 -> 5 PTS (not 6)', () => {
      // 2*(FGM - 3PM) + 3*3PM + FTM = 2*(2 - 1) + 3*1 + 0 = 2 + 3 + 0 = 5
      const points = calculatePoints({ fgm: 2, tpm: 1, ftm: 0 });
      expect(points).toBe(5);
    });

    it('calculates points with only 2-pointers and free throws', () => {
      // 3 2-pointers (FGM 3, 3PM 0) + 2 FT = 6 + 2 = 8
      expect(calculatePoints({ fgm: 3, tpm: 0, ftm: 2 })).toBe(8);
    });

    it('calculates team score as sum of player PTS', () => {
      const players = [
        { fgm: 2, tpm: 1, ftm: 0 }, // 5
        { fgm: 5, tpm: 2, ftm: 3 }, // 2*(3) + 3*(2) + 3 = 6 + 6 + 3 = 15
        { fgm: 0, tpm: 0, ftm: 0 }, // 0
      ];
      expect(calculateTeamScore(players)).toBe(20);
    });
  });

  describe('Percentages', () => {
    it('returns "—" for 0 attempts (never NaN)', () => {
      expect(calculatePercentage(0, 0)).toBe('—');
      expect(calculatePercentageNumber(0, 0)).toBeNull();
    });

    it('calculates clean integer and decimal percentages', () => {
      expect(calculatePercentage(1, 2)).toBe('50%');
      expect(calculatePercentage(1, 3)).toBe('33.3%');
      expect(calculatePercentage(2, 3)).toBe('66.7%');
      expect(calculatePercentage(4, 4)).toBe('100%');
    });
  });

  describe('Validation', () => {
    it('accepts valid stats', () => {
      const valid = validatePlayerStats({
        name: 'Arjun',
        jersey: 7,
        fgm: 4,
        fga: 8,
        tpm: 2,
        tpa: 5,
        ftm: 3,
        fta: 4,
        ast: 2,
        reb: 5,
      });
      expect(valid.valid).toBe(true);
      expect(valid.error).toBeUndefined();
    });

    it('rejects empty name', () => {
      expect(validatePlayerStats({ name: '   ' }).valid).toBe(false);
    });

    it('rejects invalid jersey numbers (< 0 or > 99 or float)', () => {
      expect(validatePlayerStats({ jersey: -1 }).valid).toBe(false);
      expect(validatePlayerStats({ jersey: 100 }).valid).toBe(false);
      expect(validatePlayerStats({ jersey: 12.5 }).valid).toBe(false);
      expect(validatePlayerStats({ jersey: 0 }).valid).toBe(true);
      expect(validatePlayerStats({ jersey: 99 }).valid).toBe(true);
    });

    it('rejects negative numbers or floats in stat counts', () => {
      expect(validatePlayerStats({ ast: -1 }).valid).toBe(false);
      expect(validatePlayerStats({ reb: 2.5 }).valid).toBe(false);
    });

    it('rejects invalid shooting combinations', () => {
      // FGM > FGA
      expect(validatePlayerStats({ fgm: 5, fga: 4 }).valid).toBe(false);
      // 3PM > 3PA
      expect(validatePlayerStats({ tpm: 3, tpa: 2 }).valid).toBe(false);
      // FTM > FTA
      expect(validatePlayerStats({ ftm: 4, fta: 3 }).valid).toBe(false);
      // 3PM > FGM
      expect(validatePlayerStats({ fgm: 2, fga: 5, tpm: 3, tpa: 4 }).valid).toBe(false);
      // 3PA > FGA
      expect(validatePlayerStats({ fgm: 2, fga: 4, tpm: 1, tpa: 5 }).valid).toBe(false);
    });

    it('validates jersey uniqueness', () => {
      expect(
        validateJerseyUniqueness([
          { jersey: 7 },
          { jersey: 12 },
          { jersey: 7 },
        ]).valid
      ).toBe(false);

      expect(
        validateJerseyUniqueness([
          { jersey: 0 },
          { jersey: 7 },
          { jersey: 99 },
        ]).valid
      ).toBe(true);
    });
  });

  describe('Quarter Delta Model', () => {
    const initialQuarters: QuarterScores = {
      Q1: 10,
      Q2: 12,
      Q3: 8,
      Q4: 0,
    };

    it('adds delta to current quarter', () => {
      // Team score goes from 30 to 33 in Q2
      const res = applyQuarterScoreDelta(initialQuarters, 'Q2', 30, 33);
      expect(res.error).toBeUndefined();
      expect(res.quarters.Q2).toBe(15);
      expect(res.quarters.Q1).toBe(10);
    });

    it('subtracts delta correctly when quarter remains >= 0', () => {
      // Team score goes from 30 to 28 in Q2
      const res = applyQuarterScoreDelta(initialQuarters, 'Q2', 30, 28);
      expect(res.error).toBeUndefined();
      expect(res.quarters.Q2).toBe(10);
    });

    it('blocks score reduction that would make current quarter negative', () => {
      // Current Q4 is 0. Score decreases by 2 while scorer is viewing Q4
      const res = applyQuarterScoreDelta(initialQuarters, 'Q4', 30, 28);
      expect(res.error).toBe('Switch to the quarter where this score was made.');
      expect(res.quarters.Q4).toBe(0);
    });
  });

  describe('Top Performers with Ties and All-Zero', () => {
    const emptyPlayers: PlayerStats[] = [];

    const allZeroPlayers: PlayerStats[] = [
      {
        id: '1',
        jersey: 1,
        name: 'Player One',
        ast: 0,
        fls: 0,
        ftm: 0,
        fta: 0,
        fgm: 0,
        fga: 0,
        tpm: 0,
        tpa: 0,
        stl: 0,
        reb: 0,
        to: 0,
      },
      {
        id: '2',
        jersey: 2,
        name: 'Player Two',
        ast: 0,
        fls: 0,
        ftm: 0,
        fta: 0,
        fgm: 0,
        fga: 0,
        tpm: 0,
        tpa: 0,
        stl: 0,
        reb: 0,
        to: 0,
      },
    ];

    it('returns "—" when all players have zero stats or list is empty', () => {
      expect(calculateTopPerformers(emptyPlayers)).toEqual({
        points: '—',
        rebounds: '—',
        assists: '—',
      });
      expect(calculateTopPerformers(allZeroPlayers)).toEqual({
        points: '—',
        rebounds: '—',
        assists: '—',
      });
    });

    it('handles clear leaders and tied performers', () => {
      const activePlayers: PlayerStats[] = [
        {
          id: '1',
          jersey: 4,
          name: 'Vivaan Rao',
          fgm: 4, // 2*(4-1)+3+1 = 6+3+1 = 10 pts
          fga: 8,
          tpm: 1,
          tpa: 2,
          ftm: 1,
          fta: 2,
          ast: 5,
          fls: 2,
          stl: 3,
          reb: 8,
          to: 2,
        },
        {
          id: '2',
          jersey: 7,
          name: 'Arjun Sen',
          fgm: 5, // 2*(5-0)+0+0 = 10 pts (tied with Vivaan)
          fga: 10,
          tpm: 0,
          tpa: 0,
          ftm: 0,
          fta: 0,
          ast: 3,
          fls: 1,
          stl: 1,
          reb: 8, // tied with Vivaan
          to: 1,
        },
        {
          id: '3',
          jersey: 11,
          name: 'Karan Mehra',
          fgm: 2,
          fga: 4,
          tpm: 0,
          tpa: 0,
          ftm: 0,
          fta: 0,
          ast: 5, // tied with Vivaan
          fls: 0,
          stl: 0,
          reb: 4,
          to: 1,
        },
      ];

      const performers = calculateTopPerformers(activePlayers);
      expect(performers.points).toBe('Vivaan Rao, Arjun Sen');
      expect(performers.rebounds).toBe('Vivaan Rao, Arjun Sen');
      expect(performers.assists).toBe('Vivaan Rao, Karan Mehra');
    });
  });

  describe('Game Result', () => {
    it('determines WIN, LOSS, and TIE accurately', () => {
      expect(determineResult(65, 50)).toBe('WIN');
      expect(determineResult(48, 52)).toBe('LOSS');
      expect(determineResult(60, 60)).toBe('TIE');
    });
  });

  describe('Team Totals Aggregation', () => {
    it('aggregates key team totals', () => {
      const players: PlayerStats[] = [
        {
          id: '1',
          jersey: 1,
          name: 'P1',
          fgm: 2,
          fga: 4,
          tpm: 1,
          tpa: 2,
          ftm: 0,
          fta: 1,
          ast: 3,
          fls: 2,
          stl: 1,
          reb: 5,
          to: 2,
        },
        {
          id: '2',
          jersey: 2,
          name: 'P2',
          fgm: 3,
          fga: 5,
          tpm: 0,
          tpa: 1,
          ftm: 2,
          fta: 2,
          ast: 1,
          fls: 1,
          stl: 2,
          reb: 4,
          to: 0,
        },
      ];

      const totals = calculateTeamTotals(players);
      // P1: 2*(2-1)+3+0 = 5 pts. P2: 2*(3-0)+0+2 = 8 pts. Total = 13 pts.
      expect(totals.points).toBe(13);
      expect(totals.assists).toBe(4);
      expect(totals.rebounds).toBe(9);
      expect(totals.steals).toBe(3);
      expect(totals.turnovers).toBe(2);
      expect(totals.fouls).toBe(3);
      expect(totals.fgm).toBe(5);
      expect(totals.fga).toBe(9);
      expect(totals.tpm).toBe(1);
      expect(totals.tpa).toBe(3);
      expect(totals.ftm).toBe(2);
      expect(totals.fta).toBe(3);
    });
  });
});
