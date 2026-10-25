import React from 'react';

export interface MatchMetadata {
  date: string;
  tipoff: string;
  court: number | string;
  category: string;
  statistician1: string;
  statistician2: string;
}

interface HeaderProps {
  meta: MatchMetadata;
  onChangeMeta: (field: keyof MatchMetadata, val: string | number) => void;
  onNavigateToTeams?: () => void;
  activeView: 'scoresheet' | 'teams' | 'report';
  onToggleView: (view: 'scoresheet' | 'teams') => void;
  userEmail?: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  meta,
  onChangeMeta,
  activeView,
  onToggleView,
  userEmail,
  onLogout,
}) => {
  return (
    <header className="match-header">
      <div className="match-header-left">
        {/* Basketball logo icon */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--orange)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 900,
          fontSize: '1.1rem'
        }}>
          🏀
        </div>
        <div>
          <h1 className="match-title">Vidya Valley School</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--orange)', fontWeight: 700 }}>
            41st YOUTH NATIONAL BASKETBALL CHAMPIONSHIP 2026
          </p>
        </div>
      </div>

      <div className="match-meta-bar">
        <div className="meta-field">
          <label>Date (dd/mm/yyyy)</label>
          <input
            type="text"
            placeholder="DD/MM/YYYY"
            value={meta.date}
            onChange={(e) => onChangeMeta('date', e.target.value)}
          />
        </div>

        <div className="meta-field">
          <label>Tip-off</label>
          <input
            type="time"
            value={meta.tipoff}
            onChange={(e) => onChangeMeta('tipoff', e.target.value)}
          />
        </div>

        <div className="meta-field">
          <label>Court</label>
          <input
            type="text"
            list="courts-list"
            placeholder="e.g. Court 1, Main Gym"
            value={meta.court}
            onChange={(e) => onChangeMeta('court', e.target.value)}
            style={{ width: '130px' }}
          />
          <datalist id="courts-list">
            <option value="Court 1" />
            <option value="Court 2" />
            <option value="Court 3" />
            <option value="Court 4" />
          </datalist>
        </div>

        <div className="meta-field">
          <label>Category</label>
          <select
            value={meta.category}
            onChange={(e) => onChangeMeta('category', e.target.value)}
          >
            <option value="Boys U-16">Boys U-16</option>
            <option value="Girls U-16">Girls U-16</option>
          </select>
        </div>

        <div className="meta-field">
          <label>Statistician 1</label>
          <input
            type="text"
            placeholder="Name"
            value={meta.statistician1}
            onChange={(e) => onChangeMeta('statistician1', e.target.value)}
          />
        </div>

        <div className="meta-field">
          <label>Statistician 2</label>
          <input
            type="text"
            placeholder="Name"
            value={meta.statistician2}
            onChange={(e) => onChangeMeta('statistician2', e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => onToggleView(activeView === 'scoresheet' ? 'teams' : 'scoresheet')}
          style={{
            background: activeView === 'teams' ? 'var(--orange)' : '#ffffff',
            color: activeView === 'teams' ? '#ffffff' : 'var(--navy)',
            border: 'none',
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {activeView === 'scoresheet' ? 'Manage Teams' : 'Back to Scoresheet'}
        </button>

        <button
          onClick={onLogout}
          style={{
            background: 'transparent',
            border: '1px solid #ffffff',
            color: '#ffffff',
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
          title={userEmail}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};
