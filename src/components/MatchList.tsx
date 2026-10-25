import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SavedMatchSummary {
  id: string;
  match_date: string | null;
  tipoff: string | null;
  court: number | null;
  category: string | null;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
  status: string;
  version: number;
  updated_at: string;
}

interface MatchListProps {
  onSelectMatch: (matchId: string) => void;
  onNewMatch: () => void;
  currentMatchId: string | null;
}

export const MatchList: React.FC<MatchListProps> = ({
  onSelectMatch,
  onNewMatch,
  currentMatchId,
}) => {
  const [matches, setMatches] = useState<SavedMatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('matches')
      .select('id, match_date, tipoff, court, category, status, version, updated_at, data')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      const summaries: SavedMatchSummary[] = data.map((m: any) => {
        const teamA = m.data?.A;
        const teamB = m.data?.B;
        const scoreA = (teamA?.players || []).reduce((acc: number, p: any) => {
          return acc + (2 * (p.fgm - p.tpm) + 3 * p.tpm + p.ftm);
        }, 0);
        const scoreB = (teamB?.players || []).reduce((acc: number, p: any) => {
          return acc + (2 * (p.fgm - p.tpm) + 3 * p.tpm + p.ftm);
        }, 0);

        return {
          id: m.id,
          match_date: m.match_date,
          tipoff: m.tipoff,
          court: m.court,
          category: m.category,
          team_a_name: teamA?.name || 'Team A',
          team_b_name: teamB?.name || 'Team B',
          team_a_score: scoreA,
          team_b_score: scoreB,
          status: m.status,
          version: m.version,
          updated_at: m.updated_at,
        };
      });
      setMatches(summaries);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid var(--card-border)',
      borderRadius: '8px',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)', textTransform: 'uppercase' }}>
          Match History
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onNewMatch}
            style={{
              background: 'var(--orange)',
              color: '#ffffff',
              border: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + New Match
          </button>
          <button
            onClick={fetchMatches}
            style={{
              background: '#ffffff',
              border: '1px solid var(--card-border)',
              padding: '0.4rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            ↻
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading match records...</p>
      ) : matches.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No matches recorded yet. Start a new match!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
          {matches.map((m) => {
            const isCurrent = m.id === currentMatchId;
            return (
              <div
                key={m.id}
                onClick={() => onSelectMatch(m.id)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: isCurrent ? '2px solid var(--navy)' : '1px solid var(--card-border)',
                  background: isCurrent ? '#EFF6FF' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {m.team_a_name} vs {m.team_b_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {m.match_date || 'No date'} • Court {m.court || '1'} • {m.category || 'U-16'} • Status: {m.status.toUpperCase()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--navy)' }}>
                    {m.team_a_score} - {m.team_b_score}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    v{m.version}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
