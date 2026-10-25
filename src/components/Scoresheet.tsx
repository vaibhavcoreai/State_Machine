import React, { useEffect, useState, useRef } from 'react';
import { Header, type MatchMetadata } from './Header';
import { Scoreboard, type ScoreboardTeamOption } from './Scoreboard';
import { TeamTable } from './TeamTable';
import { MatchList } from './MatchList';
import { supabase } from '../lib/supabase';
import {
  saveDraft,
  getLatestDraft,
  clearDraft,
  type MatchDraft,
} from '../lib/draft';
import {
  calculateTeamScore,
  validatePlayerStats,
  applyQuarterScoreDelta,
  type PlayerStats,
  type QuarterName,
  type TeamMatchData,
} from '../lib/stats';
import { downloadMatchCsv } from '../lib/csv';
import { downloadScoresheetPdf } from '../lib/scoresheetPdf';

interface ScoresheetProps {
  onToggleView: (view: 'scoresheet' | 'teams') => void;
  activeView: 'scoresheet' | 'teams' | 'report';
  userEmail?: string;
  onLogout: () => void;
  onOpenReport?: (side: 'A' | 'B', teamA: TeamMatchData, teamB: TeamMatchData, meta?: MatchMetadata) => void;
}

export type SaveStatus =
  | 'Saving…'
  | 'Saved ✓'
  | 'Save Failed'
  | 'Offline'
  | 'Unsaved changes'
  | 'Unsaved changes — press Save'
  | 'Draft recovered';

export const Scoresheet: React.FC<ScoresheetProps> = ({
  onToggleView,
  activeView,
  userEmail,
  onLogout,
  onOpenReport,
}) => {
  // Current Match ID (UUID if from DB or local new uuid)
  const [matchId, setMatchId] = useState<string>(() => crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  const [matchVersion, setMatchVersion] = useState<number>(1);
  const [isPersistedInDB, setIsPersistedInDB] = useState<boolean>(false);

  // Metadata
  const [meta, setMeta] = useState<MatchMetadata>({
    date: new Date().toLocaleDateString('en-GB'),
    tipoff: '10:00',
    court: 'Court 1',
    category: 'Boys U-16',
    statistician1: '',
    statistician2: '',
  });

  // DB teams for dropdowns
  const [dbTeams, setDbTeams] = useState<ScoreboardTeamOption[]>([]);
  const [teamAId, setTeamAId] = useState<string>('');
  const [teamBId, setTeamBId] = useState<string>('');

  // Quarters & status
  const [currentQuarter, setCurrentQuarter] = useState<QuarterName | 'FINAL'>('Q1');

  // Match snapshot data
  const [teamA, setTeamA] = useState<TeamMatchData>({
    name: '',
    players: [],
    q: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
  });

  const [teamB, setTeamB] = useState<TeamMatchData>({
    name: '',
    players: [],
    q: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
  });

  // UI sorting toggles
  const [sortJerseyA, setSortJerseyA] = useState(false);
  const [sortJerseyB, setSortJerseyB] = useState(false);

  // Inline errors for players
  const [errorsA, setErrorsA] = useState<Record<string, string>>({});
  const [errorsB, setErrorsB] = useState<Record<string, string>>({});

  // Banner message
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Save / online states
  const [, setIsOnline] = useState<boolean>(navigator.onLine);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('Unsaved changes');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Modals
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [recoveredDraftModal, setRecoveredDraftModal] = useState<MatchDraft | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);

  // Skip autosave draft on initial mount
  const isInitialMount = useRef(true);
  // Suppress autosave status reset on the render cycle immediately after a successful save
  const justSaved = useRef(false);

  // Network listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (hasUnsavedChanges) {
        setSaveStatus('Unsaved changes — press Save');
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSaveStatus('Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasUnsavedChanges]);

  // Load available teams for dropdowns
  useEffect(() => {
    const loadTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select('id, name')
        .order('name', { ascending: true });
      if (data) {
        setDbTeams(data);
      }
    };
    if (navigator.onLine) {
      loadTeams();
    }
  }, []);

  // Check for unsaved IndexedDB draft on reload/reopen
  useEffect(() => {
    getLatestDraft().then((draft) => {
      if (draft && (draft.teamA.players.length > 0 || draft.teamB.players.length > 0)) {
        setRecoveredDraftModal(draft);
      }
    });
  }, []);

  // Autosave draft to IndexedDB on every change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Skip the one re-render triggered by setMatchVersion inside handleSaveGame
    if (justSaved.current) {
      justSaved.current = false;
      return;
    }

    setHasUnsavedChanges(true);
    if (!navigator.onLine) {
      setSaveStatus('Offline');
    } else {
      setSaveStatus('Unsaved changes');
    }

    const draft: MatchDraft = {
      id: matchId,
      meta,
      teamAId,
      teamBId,
      teamA,
      teamB,
      currentQuarter,
      version: matchVersion,
      updatedAt: Date.now(),
      isPersistedInDB,
    };
    saveDraft(draft);
  }, [matchId, meta, teamAId, teamBId, teamA, teamB, currentQuarter, matchVersion]);

  const handleChangeMeta = (field: keyof MatchMetadata, val: string | number) => {
    setMeta((prev) => ({ ...prev, [field]: val }));
  };

  // Team selection: fetch players from DB, copy into match snapshot with stats at zero
  const handleSelectTeam = async (side: 'A' | 'B', teamId: string) => {
    if (!teamId) return;

    if (side === 'A' && teamId === teamBId) {
      setBannerError('Team A and Team B cannot be the same team.');
      return;
    }
    if (side === 'B' && teamId === teamAId) {
      setBannerError('Team A and Team B cannot be the same team.');
      return;
    }

    setBannerError(null);
    const selectedTeamObj = dbTeams.find((t) => t.id === teamId);
    const teamName = selectedTeamObj ? selectedTeamObj.name : `Team ${side}`;

    const { data: rosterPlayers } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('jersey', { ascending: true });

    // New match start with stats at zero
    const newPlayers: PlayerStats[] = (rosterPlayers || []).map((p) => ({
      id: p.id,
      jersey: p.jersey,
      name: p.name,
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
    }));

    if (side === 'A') {
      setTeamAId(teamId);
      setTeamA({
        name: teamName,
        players: newPlayers,
        q: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
      });
      setErrorsA({});
    } else {
      setTeamBId(teamId);
      setTeamB({
        name: teamName,
        players: newPlayers,
        q: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
      });
      setErrorsB({});
    }
  };

  // Update player stats and apply quarter model
  const handleUpdatePlayer = (
    side: 'A' | 'B',
    playerId: string,
    updates: Partial<PlayerStats>
  ) => {
    const isTeamA = side === 'A';
    const currentTeam = isTeamA ? teamA : teamB;
    const playerIndex = currentTeam.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return;

    const oldPlayer = currentTeam.players[playerIndex];
    const candidatePlayer: PlayerStats = { ...oldPlayer, ...updates };

    // Validate
    const validation = validatePlayerStats(candidatePlayer);
    if (!validation.valid) {
      const setErrors = isTeamA ? setErrorsA : setErrorsB;
      setErrors((prev) => ({
        ...prev,
        [playerId]: validation.error || 'Invalid stat combination',
      }));
      return;
    } else {
      const setErrors = isTeamA ? setErrorsA : setErrorsB;
      setErrors((prev) => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    }

    // Score delta
    const oldTeamScore = calculateTeamScore(currentTeam.players);
    const newPlayers = [...currentTeam.players];
    newPlayers[playerIndex] = candidatePlayer;
    const newTeamScore = calculateTeamScore(newPlayers);

    // Quarter model update
    const activeQuarter = currentQuarter === 'FINAL' ? 'Q4' : currentQuarter;
    const quarterResult = applyQuarterScoreDelta(
      currentTeam.q,
      activeQuarter,
      oldTeamScore,
      newTeamScore
    );

    if (quarterResult.error) {
      setBannerError(quarterResult.error);
      return;
    }

    setBannerError(null);
    const updatedTeamData: TeamMatchData = {
      ...currentTeam,
      players: newPlayers,
      q: quarterResult.quarters,
    };

    if (isTeamA) {
      setTeamA(updatedTeamData);
    } else {
      setTeamB(updatedTeamData);
    }
  };

  // Add ad-hoc player to match snapshot
  const handleAddPlayer = (side: 'A' | 'B') => {
    const isTeamA = side === 'A';
    const currentTeam = isTeamA ? teamA : teamB;

    const nextJersey = Math.max(0, ...currentTeam.players.map((p) => p.jersey + 1));
    const newPlayer: PlayerStats = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      jersey: nextJersey > 99 ? 0 : nextJersey,
      name: `Player ${currentTeam.players.length + 1}`,
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
    };

    if (isTeamA) {
      setTeamA((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
    } else {
      setTeamB((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
    }
  };

  const handleRemovePlayer = (side: 'A' | 'B', playerId: string) => {
    const isTeamA = side === 'A';
    const currentTeam = isTeamA ? teamA : teamB;

    const playerToRemove = currentTeam.players.find((p) => p.id === playerId);
    if (!playerToRemove) return;

    const oldTeamScore = calculateTeamScore(currentTeam.players);
    const newPlayers = currentTeam.players.filter((p) => p.id !== playerId);
    const newTeamScore = calculateTeamScore(newPlayers);

    const activeQuarter = currentQuarter === 'FINAL' ? 'Q4' : currentQuarter;
    const quarterResult = applyQuarterScoreDelta(
      currentTeam.q,
      activeQuarter,
      oldTeamScore,
      newTeamScore
    );

    if (quarterResult.error) {
      setBannerError(quarterResult.error);
      return;
    }

    setBannerError(null);
    const updatedTeamData: TeamMatchData = {
      ...currentTeam,
      players: newPlayers,
      q: quarterResult.quarters,
    };

    if (isTeamA) {
      setTeamA(updatedTeamData);
      setErrorsA((prev) => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    } else {
      setTeamB(updatedTeamData);
      setErrorsB((prev) => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    }
  };

  // Reset Game: with confirm, touches current match only
  const handleResetGame = () => {
    if (!window.confirm('Reset this match to zero stats? All player scores will be cleared.')) {
      return;
    }

    const resetA: TeamMatchData = {
      ...teamA,
      players: teamA.players.map((p) => ({
        ...p,
        ast: 0, fls: 0, ftm: 0, fta: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, stl: 0, reb: 0, to: 0,
      })),
      q: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
    };

    const resetB: TeamMatchData = {
      ...teamB,
      players: teamB.players.map((p) => ({
        ...p,
        ast: 0, fls: 0, ftm: 0, fta: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, stl: 0, reb: 0, to: 0,
      })),
      q: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
    };

    setTeamA(resetA);
    setTeamB(resetB);
    setCurrentQuarter('Q1');
    setErrorsA({});
    setErrorsB({});
    setBannerError(null);
  };

  // Start New Match: fresh state, zero stats, new id
  const handleNewMatch = () => {
    if (hasUnsavedChanges && !window.confirm('Start a new match? Any unsaved edits on this match should be saved first.')) {
      return;
    }

    const newId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setMatchId(newId);
    setMatchVersion(1);
    setIsPersistedInDB(false);
    setTeamAId('');
    setTeamBId('');
    setTeamA({ name: '', players: [], q: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 } });
    setTeamB({ name: '', players: [], q: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 } });
    setCurrentQuarter('Q1');
    setErrorsA({});
    setErrorsB({});
    setBannerError(null);
    setHasUnsavedChanges(false);
    setSaveStatus('Unsaved changes');
    setShowHistoryModal(false);
  };

  // Resume saved match from history
  const handleResumeMatch = async (savedMatchId: string) => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', savedMatchId)
      .single();

    if (error || !data) {
      setBannerError('Failed to load selected match');
      return;
    }

    setMatchId(data.id);
    setMatchVersion(data.version);
    setIsPersistedInDB(true);
    setTeamAId(data.team_a_id || '');
    setTeamBId(data.team_b_id || '');
    const savedMeta = data.data?._meta;
    setMeta({
      date: savedMeta?.date || data.match_date || '',
      tipoff: savedMeta?.tipoff || data.tipoff || '',
      court: savedMeta?.court || data.court || 'Court 1',
      category: savedMeta?.category || data.category || 'Boys U-16',
      statistician1: savedMeta?.statistician1 || data.statistician1 || '',
      statistician2: savedMeta?.statistician2 || data.statistician2 || '',
    });
    setCurrentQuarter(data.quarter || 'Q1');
    setTeamA(data.data?.A || { name: '', players: [], q: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 } });
    setTeamB(data.data?.B || { name: '', players: [], q: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 } });
    setHasUnsavedChanges(false);
    setSaveStatus('Saved ✓');
    setShowHistoryModal(false);
  };

  // Version-checked Save Game
  const handleSaveGame = async () => {
    if (!navigator.onLine) {
      setSaveStatus('Offline');
      setBannerError('Cannot save while offline. Edits are preserved locally in IndexedDB draft.');
      return;
    }

    setSaveStatus('Saving…');
    setBannerError(null);

    const matchPayload = {
      match_date: meta.date ? meta.date.split('/').reverse().join('-') : null, // format to YYYY-MM-DD if needed or raw
      tipoff: meta.tipoff || null,
      court: parseInt(String(meta.court), 10) || 1,
      category: meta.category,
      statistician1: meta.statistician1 || null,
      statistician2: meta.statistician2 || null,
      team_a_id: teamAId || null,
      team_b_id: teamBId || null,
      quarter: currentQuarter,
      status: currentQuarter === 'FINAL' ? 'final' : 'live',
      data: {
        A: teamA,
        B: teamB,
        _meta: meta,
      },
    };

    if (!isPersistedInDB) {
      // First save (INSERT)
      const { data, error } = await supabase
        .from('matches')
        .insert({
          id: matchId,
          ...matchPayload,
        })
        .select()
        .single();

      if (error) {
        setSaveStatus('Save Failed');
        setBannerError(`Save Failed: ${error.message}`);
      } else if (data) {
        justSaved.current = true;
        setMatchVersion(data.version);
        setIsPersistedInDB(true);
        setSaveStatus('Saved ✓');
        setHasUnsavedChanges(false);
        await clearDraft(matchId);
      }
    } else {
      // Optimistic lock check: update with version
      const { data, error } = await supabase
        .from('matches')
        .update(matchPayload)
        .eq('id', matchId)
        .eq('version', matchVersion)
        .select();

      if (error) {
        setSaveStatus('Save Failed');
        setBannerError(`Save Failed: ${error.message}`);
      } else if (!data || data.length === 0) {
        // 0 rows back -> conflict!
        setConflictModalOpen(true);
        setSaveStatus('Save Failed');
      } else {
        // 1 row back -> success
        const updatedRow = data[0];
        justSaved.current = true;
        setMatchVersion(updatedRow.version);
        setSaveStatus('Saved ✓');
        setHasUnsavedChanges(false);
        await clearDraft(matchId);
      }
    }
  };

  // Conflict dialog options: Reload latest OR Keep mine as copy
  const handleConflictReload = async () => {
    setConflictModalOpen(false);
    await handleResumeMatch(matchId);
  };

  const handleConflictKeepMine = async () => {
    setConflictModalOpen(false);
    // Assign new UUID and insert as new match
    const newId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    setMatchId(newId);
    setMatchVersion(1);
    setIsPersistedInDB(false);
    setBannerError('New match copy created. Press Save Game to save your copy.');
  };

  // Recover unsaved match handlers
  const handleRecoverDraft = (draft: MatchDraft) => {
    setMatchId(draft.id);
    setMatchVersion(draft.version);
    setMeta(draft.meta);
    setTeamAId(draft.teamAId);
    setTeamBId(draft.teamBId);
    setTeamA(draft.teamA);
    setTeamB(draft.teamB);
    setCurrentQuarter((draft.currentQuarter as any) || 'Q1');
    // Restore persisted flag so save correctly uses UPDATE, not INSERT
    setIsPersistedInDB(draft.isPersistedInDB ?? false);
    setSaveStatus('Draft recovered');
    setHasUnsavedChanges(true);
    setRecoveredDraftModal(null);
  };

  const handleDiscardDraft = async (draftId: string) => {
    await clearDraft(draftId);
    setRecoveredDraftModal(null);
  };

  const scoreA = calculateTeamScore(teamA.players);
  const scoreB = calculateTeamScore(teamB.players);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header
        meta={meta}
        onChangeMeta={handleChangeMeta}
        activeView={activeView}
        onToggleView={onToggleView}
        userEmail={userEmail}
        onLogout={onLogout}
      />

      <Scoreboard
        teamAName={teamA.name}
        teamBName={teamB.name}
        teamAId={teamAId}
        teamBId={teamBId}
        allTeams={dbTeams}
        onSelectTeamA={(id) => handleSelectTeam('A', id)}
        onSelectTeamB={(id) => handleSelectTeam('B', id)}
        scoreA={scoreA}
        scoreB={scoreB}
        currentQuarter={currentQuarter}
        onChangeQuarter={(q) => {
          setBannerError(null);
          setCurrentQuarter(q);
        }}
      />

      {/* Online/Offline/Banner status notification */}
      {bannerError && (
        <div style={{
          background: '#FEE2E2',
          borderBottom: '1px solid var(--error)',
          color: 'var(--error)',
          padding: '0.6rem 1.5rem',
          fontWeight: 700,
          fontSize: '0.85rem'
        }}>
          ⚠️ {bannerError}
        </div>
      )}

      {/* Main Scoresheet Content */}
      <main className="scoresheet-grid" style={{ flex: 1 }}>
        <TeamTable
          side="A"
          teamName={teamA.name}
          players={teamA.players}
          sortByJersey={sortJerseyA}
          onToggleSortJersey={() => setSortJerseyA((prev) => !prev)}
          onAddPlayer={() => handleAddPlayer('A')}
          onUpdatePlayer={(id, updates) => handleUpdatePlayer('A', id, updates)}
          onRemovePlayer={(id) => handleRemovePlayer('A', id)}
          playerErrors={errorsA}
        />

        <TeamTable
          side="B"
          teamName={teamB.name}
          players={teamB.players}
          sortByJersey={sortJerseyB}
          onToggleSortJersey={() => setSortJerseyB((prev) => !prev)}
          onAddPlayer={() => handleAddPlayer('B')}
          onUpdatePlayer={(id, updates) => handleUpdatePlayer('B', id, updates)}
          onRemovePlayer={(id) => handleRemovePlayer('B', id)}
          playerErrors={errorsB}
        />
      </main>

      {/* Footer bar */}
      <footer className="scoresheet-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={handleSaveGame}
            disabled={saveStatus === 'Saving…'}
            style={{
              background: 'var(--navy)',
              color: '#ffffff',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: saveStatus === 'Saving…' ? 'not-allowed' : 'pointer',
              opacity: saveStatus === 'Saving…' ? 0.7 : 1
            }}
          >
            {saveStatus === 'Saving…' ? 'Saving…' : 'Save Game'}
          </button>

          {/* Status chip */}
          <span className={`status-chip ${
            saveStatus === 'Saved ✓'
              ? 'saved'
              : saveStatus === 'Save Failed'
              ? 'error'
              : 'unsaved'
          }`}>
            {saveStatus}
          </span>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            v{matchVersion} {isPersistedInDB ? '(DB)' : '(Draft)'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => downloadMatchCsv(meta, teamA, teamB)}
            style={{
              background: '#ffffff',
              border: '1px solid var(--card-border)',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⬇ Download CSV
          </button>

          <button
            onClick={async () => {
              setPdfLoading(true);
              try { await downloadScoresheetPdf(meta, teamA, teamB, currentQuarter); }
              finally { setPdfLoading(false); }
            }}
            disabled={pdfLoading}
            style={{
              background: '#ffffff',
              border: '1px solid var(--card-border)',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: pdfLoading ? 'not-allowed' : 'pointer',
              opacity: pdfLoading ? 0.7 : 1,
            }}
          >
            {pdfLoading ? '⏳ Generating PDF…' : '📄 Print Score Sheet'}
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            style={{
              background: '#ffffff',
              border: '1px solid var(--card-border)',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Match History / Resume
          </button>

          <button
            onClick={handleNewMatch}
            style={{
              background: '#ffffff',
              border: '1px solid var(--card-border)',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + New Match
          </button>

          {onOpenReport && (
            <>
              <button
                onClick={() => onOpenReport('A', teamA, teamB, meta)}
                style={{
                  background: 'var(--team-a-blue)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Report Team A
              </button>
              <button
                onClick={() => onOpenReport('B', teamA, teamB, meta)}
                style={{
                  background: 'var(--team-b-red)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Report Team B
              </button>
            </>
          )}

          <button
            onClick={handleResetGame}
            style={{
              background: 'transparent',
              border: '1px solid var(--error)',
              color: 'var(--error)',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Reset Game
          </button>
        </div>
      </footer>

      {/* Match History Modal */}
      {showHistoryModal && (
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
            padding: '1.5rem',
            maxWidth: '650px',
            width: '90%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--navy)' }}>Matches</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <MatchList
              currentMatchId={matchId}
              onSelectMatch={handleResumeMatch}
              onNewMatch={handleNewMatch}
            />
          </div>
        </div>
      )}

      {/* Version Conflict Modal */}
      {conflictModalOpen && (
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
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--error)', marginBottom: '0.75rem' }}>
              Save Conflict Detected
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Someone else has saved updates to this match while you were editing (or another tab modified it).
              To prevent overwriting changes, choose how to proceed:
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={handleConflictReload}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--card-border)',
                  padding: '0.6rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Reload latest
              </button>
              <button
                onClick={handleConflictKeepMine}
                style={{
                  background: 'var(--navy)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Keep mine as copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recover Unsaved Match Prompt */}
      {recoveredDraftModal && (
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
            maxWidth: '460px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>
              Recover Unsaved Match?
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Found an unsaved local draft for{' '}
              <strong>
                {recoveredDraftModal.teamA.name || 'Team A'} vs{' '}
                {recoveredDraftModal.teamB.name || 'Team B'}
              </strong>{' '}
              from {new Date(recoveredDraftModal.updatedAt).toLocaleTimeString()}. Would you like to recover it?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => handleDiscardDraft(recoveredDraftModal.id)}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--card-border)',
                  color: 'var(--error)',
                  padding: '0.6rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Discard
              </button>
              <button
                onClick={() => handleRecoverDraft(recoveredDraftModal)}
                style={{
                  background: 'var(--navy)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Recover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
