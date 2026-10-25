import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface DBTeam {
  id: string;
  name: string;
  version: number;
  updated_at: string;
}

export interface DBPlayer {
  id: string;
  team_id: string;
  name: string;
  jersey: number;
}

export function TeamsManager() {
  const [teams, setTeams] = useState<DBTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<DBTeam | null>(null);
  const [players, setPlayers] = useState<DBPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New team form
  const [newTeamName, setNewTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Edit team form
  const [editingTeamName, setEditingTeamName] = useState('');
  const [savingTeamName, setSavingTeamName] = useState(false);

  // New player form
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerJersey, setNewPlayerJersey] = useState<number | ''>('');
  const [addingPlayer, setAddingPlayer] = useState(false);

  // Conflict modal state
  const [conflictOpen, setConflictOpen] = useState(false);

  const fetchTeams = async () => {
    setLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setTeams(data || []);
      if (selectedTeam) {
        const stillExists = (data || []).find((t) => t.id === selectedTeam.id);
        if (stillExists) {
          setSelectedTeam(stillExists);
          setEditingTeamName(stillExists.name);
        } else {
          setSelectedTeam(null);
          setPlayers([]);
        }
      }
    }
    setLoading(false);
  };

  const fetchPlayers = async (teamId: string) => {
    setErrorMsg(null);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('jersey', { ascending: true });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setPlayers(data || []);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleSelectTeam = (team: DBTeam) => {
    setSelectedTeam(team);
    setEditingTeamName(team.name);
    setErrorMsg(null);
    setSuccessMsg(null);
    fetchPlayers(team.id);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const trimmed = newTeamName.trim();
    if (!trimmed) {
      setErrorMsg('Team name cannot be empty');
      return;
    }

    if (teams.length >= 50) {
      setErrorMsg('Maximum limit of 50 teams reached');
      return;
    }

    setCreatingTeam(true);
    const { data, error } = await supabase
      .from('teams')
      .insert({ name: trimmed })
      .select()
      .single();

    setCreatingTeam(false);
    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      setNewTeamName('');
      setSuccessMsg(`Team "${data.name}" registered.`);
      await fetchTeams();
      handleSelectTeam(data);
    }
  };

  const handleSaveTeamName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    const trimmed = editingTeamName.trim();
    if (!trimmed) {
      setErrorMsg('Team name cannot be empty');
      return;
    }

    setSavingTeamName(true);
    // Optimistic lock check: update where id and version match
    const { data, error } = await supabase
      .from('teams')
      .update({ name: trimmed })
      .eq('id', selectedTeam.id)
      .eq('version', selectedTeam.version)
      .select();

    setSavingTeamName(false);
    if (error) {
      setErrorMsg(error.message);
    } else if (!data || data.length === 0) {
      setConflictOpen(true);
    } else {
      const updated = data[0];
      setSelectedTeam(updated);
      setEditingTeamName(updated.name);
      setSuccessMsg('Team name updated.');
      await fetchTeams();
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Delete team "${teamName}" and all its players? Past match snapshots remain unchanged.`)) {
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg(`Team "${teamName}" deleted.`);
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setPlayers([]);
      }
      await fetchTeams();
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = newPlayerName.trim();
    if (!trimmedName) {
      setErrorMsg('Player name cannot be empty');
      return;
    }

    if (newPlayerJersey === '' || !Number.isInteger(Number(newPlayerJersey))) {
      setErrorMsg('Jersey number is required');
      return;
    }

    const jerseyNum = Number(newPlayerJersey);
    if (jerseyNum < 0 || jerseyNum > 99) {
      setErrorMsg('Jersey must be between 0 and 99');
      return;
    }

    if (players.length >= 12) {
      setErrorMsg('Maximum limit of 12 players per team reached');
      return;
    }

    const duplicate = players.some((p) => p.jersey === jerseyNum);
    if (duplicate) {
      setErrorMsg(`Jersey #${jerseyNum} is already assigned to a player in this team`);
      return;
    }

    setAddingPlayer(true);
    const { error } = await supabase
      .from('players')
      .insert({
        team_id: selectedTeam.id,
        name: trimmedName,
        jersey: jerseyNum,
      });

    setAddingPlayer(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setNewPlayerName('');
      setNewPlayerJersey('');
      setSuccessMsg(`Player "${trimmedName}" (#${jerseyNum}) added.`);
      await fetchPlayers(selectedTeam.id);
    }
  };

  const handleDeletePlayer = async (playerId: string, playerName: string, jersey: number) => {
    if (!window.confirm(`Remove player "${playerName}" (#${jersey})?`)) {
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    const { error } = await supabase.from('players').delete().eq('id', playerId);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg(`Player "${playerName}" removed.`);
      if (selectedTeam) {
        await fetchPlayers(selectedTeam.id);
      }
    }
  };

  const handleConflictReload = async () => {
    setConflictOpen(false);
    await fetchTeams();
    if (selectedTeam) {
      const { data } = await supabase.from('teams').select('*').eq('id', selectedTeam.id).single();
      if (data) {
        setSelectedTeam(data);
        setEditingTeamName(data.name);
      }
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--navy)', textTransform: 'uppercase' }}>Manage Teams & Rosters</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Registered Teams: {teams.length} / 50 (max 12 players per team)
          </p>
        </div>
        <button
          onClick={fetchTeams}
          style={{
            background: '#ffffff',
            border: '1px solid var(--card-border)',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          Refresh List
        </button>
      </div>

      {errorMsg && (
        <div style={{
          background: '#FEE2E2',
          border: '1px solid var(--error)',
          color: 'var(--error)',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          fontSize: '0.9rem'
        }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{
          background: '#DCFCE7',
          border: '1px solid var(--success)',
          color: 'var(--success)',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          fontSize: '0.9rem'
        }}>
          {successMsg}
        </div>
      )}

      {/* Grid Layout: Left Teams List, Right Team Details & Roster */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Register Team & Teams List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Register Team Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            padding: '1.25rem'
          }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>Register New Team</h3>
            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Team Name (e.g. Vidya Valley Hawks)"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                disabled={teams.length >= 50 || creatingTeam}
                required
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--card-border)',
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="submit"
                disabled={teams.length >= 50 || creatingTeam}
                style={{
                  background: 'var(--navy)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: teams.length >= 50 ? 'not-allowed' : 'pointer',
                  opacity: teams.length >= 50 ? 0.6 : 1
                }}
              >
                {creatingTeam ? 'Registering...' : '+ Add Team'}
              </button>
            </form>
          </div>

          {/* Teams List */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            padding: '1.25rem'
          }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>
              Teams ({teams.length})
            </h3>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading teams...</p>
            ) : teams.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No teams registered yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '450px', overflowY: 'auto' }}>
                {teams.map((t) => {
                  const isSelected = selectedTeam?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTeam(t)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: isSelected ? '1px solid var(--navy)' : '1px solid var(--card-border)',
                        background: isSelected ? '#EFF6FF' : '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontWeight: isSelected ? 600 : 400, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {t.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTeam(t.id, t.name);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--error)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          padding: '0.2rem 0.4rem'
                        }}
                        title="Delete team"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Team Roster Management */}
        <div>
          {selectedTeam ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              {/* Edit Team Header */}
              <div style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                <form onSubmit={handleSaveTeamName} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={editingTeamName}
                    onChange={(e) => setEditingTeamName(e.target.value)}
                    required
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      padding: '0.4rem 0.6rem',
                      borderRadius: '4px',
                      border: '1px solid var(--card-border)',
                      flex: 1
                    }}
                  />
                  <button
                    type="submit"
                    disabled={savingTeamName || editingTeamName.trim() === selectedTeam.name}
                    style={{
                      background: 'var(--navy)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      cursor: savingTeamName || editingTeamName.trim() === selectedTeam.name ? 'default' : 'pointer',
                      opacity: editingTeamName.trim() === selectedTeam.name ? 0.5 : 1
                    }}
                  >
                    {savingTeamName ? 'Saving...' : 'Rename Team'}
                  </button>
                </form>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Version: {selectedTeam.version}</span>
                  <span>Roster: {players.length} / 12 players</span>
                </div>
              </div>

              {/* Add Player Form */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid var(--card-border)',
                borderRadius: '6px',
                padding: '1rem'
              }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>
                  + Add Player (Max 12)
                </h4>
                <form onSubmit={handleAddPlayer} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Jersey #"
                    min={0}
                    max={99}
                    value={newPlayerJersey}
                    onChange={(e) => setNewPlayerJersey(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    disabled={players.length >= 12 || addingPlayer}
                    required
                    style={{
                      width: '100px',
                      padding: '0.5rem 0.6rem',
                      borderRadius: '4px',
                      border: '1px solid var(--card-border)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Player Name (e.g. Vivaan Rao)"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    disabled={players.length >= 12 || addingPlayer}
                    required
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.6rem',
                      borderRadius: '4px',
                      border: '1px solid var(--card-border)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={players.length >= 12 || addingPlayer}
                    style={{
                      background: 'var(--navy)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      fontWeight: 600,
                      cursor: players.length >= 12 ? 'not-allowed' : 'pointer',
                      opacity: players.length >= 12 ? 0.6 : 1
                    }}
                  >
                    {addingPlayer ? 'Adding...' : 'Add Player'}
                  </button>
                </form>
              </div>

              {/* Roster Table */}
              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>
                  Roster Table ({players.length} players)
                </h4>
                {players.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No players registered in this team yet. Add players above.
                  </p>
                ) : (
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.9rem',
                    textAlign: 'left'
                  }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '1px solid var(--card-border)' }}>
                        <th style={{ padding: '0.6rem 0.75rem', width: '90px' }}>Jersey #</th>
                        <th style={{ padding: '0.6rem 0.75rem' }}>Player Name</th>
                        <th style={{ padding: '0.6rem 0.75rem', width: '80px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--navy)' }}>
                            #{p.jersey}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem' }}>
                            {p.name}
                          </td>
                          <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeletePlayer(p.id, p.name, p.jersey)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              border: '1px dashed var(--card-border)',
              borderRadius: '8px',
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <p style={{ fontSize: '1.05rem', fontWeight: 500 }}>Select a team on the left to manage roster</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Or register a new team above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Version Conflict Modal */}
      {conflictOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--error)', marginBottom: '0.75rem' }}>
              Conflict Detected
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              This team was modified by another user or session while you were editing. To prevent overwriting changes, please reload the latest data.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={handleConflictReload}
                style={{
                  background: 'var(--navy)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Reload Latest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default TeamsManager;
