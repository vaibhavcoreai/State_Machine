import React from 'react';
import {
  calculatePoints,
  type PlayerStats,
} from '../lib/stats';

interface TeamTableProps {
  side: 'A' | 'B';
  teamName: string;
  players: PlayerStats[];
  sortByJersey: boolean;
  onToggleSortJersey: () => void;
  onAddPlayer: () => void;
  onUpdatePlayer: (playerId: string, updates: Partial<PlayerStats>) => void;
  onRemovePlayer: (playerId: string) => void;
  playerErrors: Record<string, string>;
}

export const TeamTable: React.FC<TeamTableProps> = ({
  side,
  teamName,
  players,
  sortByJersey,
  onToggleSortJersey,
  onAddPlayer,
  onUpdatePlayer,
  onRemovePlayer,
  playerErrors,
}) => {
  const isTeamA = side === 'A';

  const displayedPlayers = [...players].sort((a, b) => {
    if (sortByJersey) {
      return a.jersey - b.jersey;
    }
    return 0; // preserve order
  });

  const handleNumericInput = (
    playerId: string,
    field: keyof PlayerStats,
    valStr: string
  ) => {
    if (valStr === '') {
      onUpdatePlayer(playerId, { [field]: 0 });
      return;
    }
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdatePlayer(playerId, { [field]: parsed });
    }
  };

  return (
    <div className="team-table-card">
      <div className={`team-table-header ${isTeamA ? 'team-a' : 'team-b'}`}>
        <div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: isTeamA ? 'var(--team-a-blue)' : 'var(--team-b-red)',
            marginRight: '0.5rem',
            textTransform: 'uppercase'
          }}>
            TEAM {side}
          </span>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy)' }}>
            {teamName || `Team ${side}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onToggleSortJersey}
            style={{
              background: sortByJersey ? '#E2E8F0' : '#ffffff',
              border: '1px solid var(--card-border)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Jersey # {sortByJersey ? '▲' : '⇅'}
          </button>

          <button
            onClick={onAddPlayer}
            style={{
              background: isTeamA ? 'var(--team-a-blue)' : 'var(--team-b-red)',
              color: '#ffffff',
              border: 'none',
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + Add Player
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="stat-table tabular-nums">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th style={{ minWidth: '100px', textAlign: 'left', paddingLeft: '0.5rem' }}>Name</th>
              <th style={{ width: '38px' }} className="cell-pts">PTS</th>
              <th style={{ width: '36px' }} className="cell-ast">AST</th>
              <th style={{ width: '36px' }} className="cell-fls">FLS</th>
              <th style={{ width: '70px' }} className="cell-ft">FT M/A</th>
              <th style={{ width: '70px' }} className="cell-fg">FG M/A</th>
              <th style={{ width: '70px' }} className="cell-3p">3P M/A</th>
              <th style={{ width: '36px' }} className="cell-stl">STL</th>
              <th style={{ width: '36px' }} className="cell-reb">REB</th>
              <th style={{ width: '36px' }} className="cell-to">TO</th>
              <th style={{ width: '30px' }}></th>
            </tr>
          </thead>
          <tbody>
            {displayedPlayers.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No players in snapshot. Select team from dropdown or click "+ Add Player".
                </td>
              </tr>
            ) : (
              displayedPlayers.map((player) => {
                const pts = calculatePoints(player);
                const hasError = playerErrors[player.id];

                return (
                  <React.Fragment key={player.id}>
                    <tr>
                      {/* Jersey # (editable) */}
                      <td>
                        <input
                          type="number"
                          className="stat-input-small"
                          value={player.jersey}
                          min={0}
                          max={99}
                          onChange={(e) => handleNumericInput(player.id, 'jersey', e.target.value)}
                        />
                      </td>

                      {/* Name (editable) */}
                      <td style={{ textAlign: 'left', paddingLeft: '0.5rem' }}>
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => onUpdatePlayer(player.id, { name: e.target.value })}
                          style={{
                            width: '95%',
                            border: 'none',
                            background: 'transparent',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            outline: 'none'
                          }}
                        />
                      </td>

                      {/* Derived PTS */}
                      <td className="cell-pts">{pts}</td>

                      {/* AST */}
                      <td className="cell-ast">
                        <input
                          type="number"
                          className="stat-input-single"
                          value={player.ast}
                          min={0}
                          onChange={(e) => handleNumericInput(player.id, 'ast', e.target.value)}
                        />
                      </td>

                      {/* FLS */}
                      <td className="cell-fls">
                        <input
                          type="number"
                          className="stat-input-single"
                          value={player.fls}
                          min={0}
                          onChange={(e) => handleNumericInput(player.id, 'fls', e.target.value)}
                        />
                      </td>

                      {/* FT M/A */}
                      <td className="cell-ft">
                        <div className="ma-cell">
                          <input
                            type="number"
                            className="stat-input-small"
                            value={player.ftm}
                            min={0}
                            title="FT Made"
                            onChange={(e) => handleNumericInput(player.id, 'ftm', e.target.value)}
                          />
                          <span>/</span>
                          <input
                            type="number"
                            className="stat-input-small"
                            value={player.fta}
                            min={0}
                            title="FT Attempted"
                            onChange={(e) => handleNumericInput(player.id, 'fta', e.target.value)}
                          />
                        </div>
                      </td>

                      {/* FG M/A */}
                      <td className="cell-fg">
                        <div className="ma-cell">
                          <input
                            type="number"
                            className="stat-input-small"
                            value={player.fgm}
                            min={0}
                            title="FG Made"
                            onChange={(e) => handleNumericInput(player.id, 'fgm', e.target.value)}
                          />
                          <span>/</span>
                          <input
                            type="number"
                            className="stat-input-small"
                            value={player.fga}
                            min={0}
                            title="FG Attempted"
                            onChange={(e) => handleNumericInput(player.id, 'fga', e.target.value)}
                          />
                        </div>
                      </td>

                      {/* 3P M/A */}
                      <td className="cell-3p">
                        <div className="ma-cell">
                          <input
                            type="number"
                            className="stat-input-small"
                            value={player.tpm}
                            min={0}
                            title="3P Made"
                            onChange={(e) => handleNumericInput(player.id, 'tpm', e.target.value)}
                          />
                          <span>/</span>
                          <input
                            type="number"
                            className="stat-input-small"
                            value={player.tpa}
                            min={0}
                            title="3P Attempted"
                            onChange={(e) => handleNumericInput(player.id, 'tpa', e.target.value)}
                          />
                        </div>
                      </td>

                      {/* STL */}
                      <td className="cell-stl">
                        <input
                          type="number"
                          className="stat-input-single"
                          value={player.stl}
                          min={0}
                          onChange={(e) => handleNumericInput(player.id, 'stl', e.target.value)}
                        />
                      </td>

                      {/* REB */}
                      <td className="cell-reb">
                        <input
                          type="number"
                          className="stat-input-single"
                          value={player.reb}
                          min={0}
                          onChange={(e) => handleNumericInput(player.id, 'reb', e.target.value)}
                        />
                      </td>

                      {/* TO */}
                      <td className="cell-to">
                        <input
                          type="number"
                          className="stat-input-single"
                          value={player.to}
                          min={0}
                          onChange={(e) => handleNumericInput(player.id, 'to', e.target.value)}
                        />
                      </td>

                      {/* Remove player */}
                      <td>
                        <button
                          onClick={() => onRemovePlayer(player.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            padding: '2px'
                          }}
                          title="Remove player from match"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>

                    {/* Inline error message for invalid combinations */}
                    {hasError && (
                      <tr>
                        <td
                          colSpan={12}
                          style={{
                            background: '#FEE2E2',
                            color: 'var(--error)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.5rem',
                            textAlign: 'left'
                          }}
                        >
                          ⚠️ {player.name}: {hasError}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
