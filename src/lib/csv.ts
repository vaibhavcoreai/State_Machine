import type { MatchMetadata } from '../components/Header';
import {
  calculatePoints,
  calculatePercentage,
  type TeamMatchData,
} from './stats';


function escapeCsvField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) {
    return '""';
  }
  const str = String(field);
  // If field contains comma, quote, or newline, escape double quotes and wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates properly escaped CSV content with match metadata and one row per player (both teams).
 */
export function generateMatchCsv(
  meta: MatchMetadata,
  teamA: TeamMatchData,
  teamB: TeamMatchData
): string {
  const lines: string[] = [];

  // Metadata headers
  lines.push(['# MATCH METADATA', ''].join(','));
  lines.push(['Date', escapeCsvField(meta.date)].join(','));
  lines.push(['Tip-off', escapeCsvField(meta.tipoff)].join(','));
  lines.push(['Court', escapeCsvField(meta.court)].join(','));
  lines.push(['Category', escapeCsvField(meta.category)].join(','));
  lines.push(['Statistician 1', escapeCsvField(meta.statistician1)].join(','));
  lines.push(['Statistician 2', escapeCsvField(meta.statistician2)].join(','));
  lines.push(['Team A', escapeCsvField(teamA.name || 'Team A')].join(','));
  lines.push(['Team B', escapeCsvField(teamB.name || 'Team B')].join(','));
  lines.push(['Team A Quarters', escapeCsvField(`Q1:${teamA.q.Q1} Q2:${teamA.q.Q2} Q3:${teamA.q.Q3} Q4:${teamA.q.Q4}`)].join(','));
  lines.push(['Team B Quarters', escapeCsvField(`Q1:${teamB.q.Q1} Q2:${teamB.q.Q2} Q3:${teamB.q.Q3} Q4:${teamB.q.Q4}`)].join(','));
  lines.push('');

  // Column headers for player stats
  const headers = [
    'Side',
    'Team',
    'Jersey',
    'Player Name',
    'PTS',
    'AST',
    'FLS',
    'FTM',
    'FTA',
    'FT%',
    'FGM',
    'FGA',
    'FG%',
    '3PM',
    '3PA',
    '3P%',
    'STL',
    'REB',
    'TO',
  ];
  lines.push(headers.map(escapeCsvField).join(','));

  // Helper to add player rows
  const addPlayerRows = (side: 'A' | 'B', team: TeamMatchData) => {
    for (const p of team.players) {
      const pts = calculatePoints(p);
      const ftPct = calculatePercentage(p.ftm, p.fta);
      const fgPct = calculatePercentage(p.fgm, p.fga);
      const tpPct = calculatePercentage(p.tpm, p.tpa);

      const row = [
        escapeCsvField(side),
        escapeCsvField(team.name || `Team ${side}`),
        escapeCsvField(p.jersey),
        escapeCsvField(p.name),
        escapeCsvField(pts),
        escapeCsvField(p.ast),
        escapeCsvField(p.fls),
        escapeCsvField(p.ftm),
        escapeCsvField(p.fta),
        escapeCsvField(ftPct),
        escapeCsvField(p.fgm),
        escapeCsvField(p.fga),
        escapeCsvField(fgPct),
        escapeCsvField(p.tpm),
        escapeCsvField(p.tpa),
        escapeCsvField(tpPct),
        escapeCsvField(p.stl),
        escapeCsvField(p.reb),
        escapeCsvField(p.to),
      ];
      lines.push(row.join(','));
    }
  };

  addPlayerRows('A', teamA);
  addPlayerRows('B', teamB);

  return lines.join('\r\n');
}

/**
 * Triggers a browser download of the match CSV file.
 */
export function downloadMatchCsv(
  meta: MatchMetadata,
  teamA: TeamMatchData,
  teamB: TeamMatchData
): void {
  const csvContent = generateMatchCsv(meta, teamA, teamB);
  // Include UTF-8 BOM so Excel opens non-ASCII player names cleanly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const cleanTeamA = (teamA.name || 'TeamA').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanTeamB = (teamB.name || 'TeamB').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanTeamA}_vs_${cleanTeamB}_Match_Stats.csv`;

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
