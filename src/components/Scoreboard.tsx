import React from 'react';
import type { QuarterName } from '../lib/stats';

export interface ScoreboardTeamOption {
  id: string;
  name: string;
}

interface ScoreboardProps {
  teamAName: string;
  teamBName: string;
  teamAId: string;
  teamBId: string;
  allTeams: ScoreboardTeamOption[];
  onSelectTeamA: (teamId: string) => void;
  onSelectTeamB: (teamId: string) => void;
  scoreA: number;
  scoreB: number;
  currentQuarter: QuarterName | 'FINAL';
  onChangeQuarter: (q: QuarterName | 'FINAL') => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  teamAName,
  teamBName,
  teamAId,
  teamBId,
  allTeams,
  onSelectTeamA,
  onSelectTeamB,
  scoreA,
  scoreB,
  currentQuarter,
  onChangeQuarter,
}) => {
  return (
    <div className="scoreboard-bar">
      {/* Team A Section */}
      <div className="scoreboard-team">
        <div className="team-shield team-a">A</div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--team-a-blue)', textTransform: 'uppercase' }}>
            TEAM A
          </div>
          <select
            value={teamAId}
            onChange={(e) => onSelectTeamA(e.target.value)}
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--navy)',
              border: '1px solid var(--card-border)',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              background: '#ffffff',
              cursor: 'pointer',
              maxWidth: '220px'
            }}
          >
            <option value="">{teamAName || 'Select Team A'}</option>
            {allTeams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id === teamBId}>
                {t.name} {t.id === teamBId ? '(Selected on Team B)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team A Score */}
      <div className="score-display">{scoreA}</div>

      {/* Quarter / Period Toggle */}
      <div className="quarter-toggle-container">
        <span className="quarter-toggle-label">CURRENT QUARTER</span>
        <div className="quarter-toggles">
          {(['Q1', 'Q2', 'Q3', 'Q4', 'FINAL'] as const).map((q) => (
            <button
              key={q}
              className={`quarter-btn ${currentQuarter === q ? 'active' : ''}`}
              onClick={() => onChangeQuarter(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Team B Score */}
      <div className="score-display">{scoreB}</div>

      {/* Team B Section */}
      <div className="scoreboard-team" style={{ flexDirection: 'row-reverse' }}>
        <div className="team-shield team-b">B</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--team-b-red)', textTransform: 'uppercase' }}>
            TEAM B
          </div>
          <select
            value={teamBId}
            onChange={(e) => onSelectTeamB(e.target.value)}
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              color: 'var(--navy)',
              border: '1px solid var(--card-border)',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              background: '#ffffff',
              cursor: 'pointer',
              maxWidth: '220px'
            }}
          >
            <option value="">{teamBName || 'Select Team B'}</option>
            {allTeams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id === teamAId}>
                {t.name} {t.id === teamAId ? '(Selected on Team A)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
