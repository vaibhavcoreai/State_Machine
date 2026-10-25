export interface PlayerStats {
  id: string;
  jersey: number;
  name: string;
  ast: number;
  fls: number;
  ftm: number;
  fta: number;
  fgm: number;
  fga: number;
  tpm: number; // 3PM
  tpa: number; // 3PA
  stl: number;
  reb: number;
  to: number;
}

export type QuarterName = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface QuarterScores {
  Q1: number;
  Q2: number;
  Q3: number;
  Q4: number;
}

export interface TeamMatchData {
  name: string;
  players: PlayerStats[];
  q: QuarterScores;
}

export interface MatchData {
  A: TeamMatchData;
  B: TeamMatchData;
}

export type GameResult = 'WIN' | 'LOSS' | 'TIE';

/**
 * PTS = 2*(FGM − 3PM) + 3*3PM + FTM
 * Simplified: 2*FGM + 3PM + FTM
 */
export function calculatePoints(player: Pick<PlayerStats, 'fgm' | 'tpm' | 'ftm'>): number {
  return 2 * (player.fgm - player.tpm) + 3 * player.tpm + player.ftm;
}

/**
 * Team score = sum of player PTS.
 */
export function calculateTeamScore(players: Pick<PlayerStats, 'fgm' | 'tpm' | 'ftm'>[]): number {
  return players.reduce((total, player) => total + calculatePoints(player), 0);
}

/**
 * FG% = FGM/FGA*100, 3P% = 3PM/3PA*100, FT% = FTM/FTA*100.
 * Attempts 0 → "—", never NaN.
 * Rounds to integer percentage if integer, or 1 decimal place.
 */
export function calculatePercentage(made: number, attempted: number): string {
  if (attempted <= 0) {
    return '—';
  }
  const pct = (made / attempted) * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

/**
 * Numeric percentage calculation returning number | null (null for 0 attempts).
 */
export function calculatePercentageNumber(made: number, attempted: number): number | null {
  if (attempted <= 0) {
    return null;
  }
  return (made / attempted) * 100;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates player stats fields:
 * - Inputs: non-negative integers only.
 * - Reject: FGM>FGA, 3PM>3PA, FTM>FTA, 3PM>FGM, 3PA>FGA.
 * - Jersey: 0–99 integer.
 * - Name: non-empty trimmed.
 */
export function validatePlayerStats(stats: Partial<PlayerStats>): ValidationResult {
  if (stats.name !== undefined && stats.name.trim().length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  if (stats.jersey !== undefined) {
    if (!Number.isInteger(stats.jersey) || stats.jersey < 0 || stats.jersey > 99) {
      return { valid: false, error: 'Jersey must be an integer between 0 and 99' };
    }
  }

  const numericFields: (keyof PlayerStats)[] = [
    'ast', 'fls', 'ftm', 'fta', 'fgm', 'fga', 'tpm', 'tpa', 'stl', 'reb', 'to'
  ];

  for (const field of numericFields) {
    const val = stats[field];
    if (val !== undefined) {
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 0) {
        return { valid: false, error: `${field.toUpperCase()} must be a non-negative integer` };
      }
    }
  }

  const ftm = stats.ftm ?? 0;
  const fta = stats.fta ?? 0;
  if (ftm > fta) {
    return { valid: false, error: 'FT Made cannot exceed FT Attempted (FTM > FTA)' };
  }

  const tpm = stats.tpm ?? 0;
  const tpa = stats.tpa ?? 0;
  if (tpm > tpa) {
    return { valid: false, error: '3P Made cannot exceed 3P Attempted (3PM > 3PA)' };
  }

  const fgm = stats.fgm ?? 0;
  const fga = stats.fga ?? 0;
  if (fgm > fga) {
    return { valid: false, error: 'FG Made cannot exceed FG Attempted (FGM > FGA)' };
  }

  if (tpm > fgm) {
    return { valid: false, error: '3P Made cannot exceed FG Made (3PM > FGM)' };
  }

  if (tpa > fga) {
    return { valid: false, error: '3P Attempted cannot exceed FG Attempted (3PA > FGA)' };
  }

  return { valid: true };
}

/**
 * Validates jerseys uniqueness within a roster.
 */
export function validateJerseyUniqueness(players: Pick<PlayerStats, 'jersey'>[]): ValidationResult {
  const seen = new Set<number>();
  for (const player of players) {
    if (seen.has(player.jersey)) {
      return { valid: false, error: `Duplicate jersey number ${player.jersey}` };
    }
    seen.add(player.jersey);
  }
  return { valid: true };
}

/**
 * Quarter model:
 * On every stat edit: delta = newTeamScore − oldTeamScore; q[currentQuarter] += delta.
 * Invariant: sum(q) === team score; no quarter below 0.
 * If an edit would push the current quarter below 0, block it with:
 * "Switch to the quarter where this score was made."
 */
export function applyQuarterScoreDelta(
  currentQuarters: QuarterScores,
  currentQuarter: QuarterName,
  oldTeamScore: number,
  newTeamScore: number
): { quarters: QuarterScores; error?: string } {
  const delta = newTeamScore - oldTeamScore;
  const targetQuarterScore = currentQuarters[currentQuarter] + delta;

  if (targetQuarterScore < 0) {
    return {
      quarters: currentQuarters,
      error: 'Switch to the quarter where this score was made.',
    };
  }

  return {
    quarters: {
      ...currentQuarters,
      [currentQuarter]: targetQuarterScore,
    },
  };
}

export interface TopPerformers {
  points: string;
  rebounds: string;
  assists: string;
}

/**
 * Top Performers:
 * most PTS, REB, AST; ties show all names comma-separated; all-zero shows "—".
 */
export function calculateTopPerformers(players: PlayerStats[]): TopPerformers {
  const getLeader = (getValue: (p: PlayerStats) => number): string => {
    if (!players || players.length === 0) return '—';

    let maxVal = 0;
    for (const p of players) {
      const v = getValue(p);
      if (v > maxVal) {
        maxVal = v;
      }
    }

    if (maxVal === 0) {
      return '—';
    }

    const leaders = players
      .filter((p) => getValue(p) === maxVal)
      .map((p) => p.name);

    return leaders.join(', ');
  };

  return {
    points: getLeader((p) => calculatePoints(p)),
    rebounds: getLeader((p) => p.reb),
    assists: getLeader((p) => p.ast),
  };
}

/**
 * Match result for a team:
 * Higher score wins; equal = TIE.
 */
export function determineResult(teamScore: number, opponentScore: number): GameResult {
  if (teamScore > opponentScore) return 'WIN';
  if (teamScore < opponentScore) return 'LOSS';
  return 'TIE';
}

export interface KeyTeamTotals {
  points: number;
  rebounds: number;
  assists: number;
  turnovers: number;
  fouls: number;
  steals: number;
  ftm: number;
  fta: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
}

/**
 * Aggregates all player stats for key team statistics card.
 */
export function calculateTeamTotals(players: PlayerStats[]): KeyTeamTotals {
  return players.reduce(
    (acc, p) => ({
      points: acc.points + calculatePoints(p),
      rebounds: acc.rebounds + p.reb,
      assists: acc.assists + p.ast,
      turnovers: acc.turnovers + p.to,
      fouls: acc.fouls + p.fls,
      steals: acc.steals + p.stl,
      ftm: acc.ftm + p.ftm,
      fta: acc.fta + p.fta,
      fgm: acc.fgm + p.fgm,
      fga: acc.fga + p.fga,
      tpm: acc.tpm + p.tpm,
      tpa: acc.tpa + p.tpa,
    }),
    {
      points: 0,
      rebounds: 0,
      assists: 0,
      turnovers: 0,
      fouls: 0,
      steals: 0,
      ftm: 0,
      fta: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
    }
  );
}
