import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Scoresheet } from './components/Scoresheet';
import { TeamsManager } from './components/TeamsManager';
import { Report } from './components/Report';
import type { TeamMatchData } from './lib/stats';
import './styles/app.css';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<'scoresheet' | 'teams' | 'report'>('scoresheet');

  // Report view state
  const [reportSide, setReportSide] = useState<'A' | 'B'>('A');
  const [reportTeamA, setReportTeamA] = useState<TeamMatchData | null>(null);
  const [reportTeamB, setReportTeamB] = useState<TeamMatchData | null>(null);
  const [reportMeta, setReportMeta] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setAuthError(error.message);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAuthError(err.message);
      } else {
        setAuthError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleOpenReport = (side: 'A' | 'B', teamA: TeamMatchData, teamB: TeamMatchData, meta?: any) => {
    setReportSide(side);
    setReportTeamA(teamA);
    setReportTeamB(teamB);
    setReportMeta(meta ?? null);
    setActiveView('report');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '1.5rem',
        backgroundColor: 'var(--bg)'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{
            background: 'var(--navy)',
            color: '#ffffff',
            padding: '1rem',
            borderRadius: '6px',
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <h1 style={{ fontSize: '1.25rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Vidya Valley Stats Machine
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--orange)', marginTop: '0.25rem', fontWeight: 600 }}>
              Authorized Scorers Login
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {authError && (
              <div style={{
                background: '#FEE2E2',
                border: '1px solid var(--error)',
                color: 'var(--error)',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                {authError}
              </div>
            )}

            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--card-border)',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--card-border)',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '0.5rem',
                background: 'var(--navy)',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '4px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (activeView === 'report' && reportTeamA && reportTeamB) {
    return (
      <Report
        side={reportSide}
        teamA={reportTeamA}
        teamB={reportTeamB}
        meta={reportMeta}
        onBack={() => setActiveView('scoresheet')}
      />
    );
  }

  if (activeView === 'teams') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header className="match-header">
          <div className="match-header-left">
            <h1 className="match-title">Vidya Valley School</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--orange)', fontWeight: 700 }}>
              U-16 TOURNAMENT • TEAMS ROSTER
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setActiveView('scoresheet')}
              style={{
                background: 'var(--orange)',
                color: '#ffffff',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              ← Back to Scoresheet
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid #ffffff',
                color: '#ffffff',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </header>
        <main style={{ padding: '2rem', flex: 1 }}>
          <TeamsManager />
        </main>
      </div>
    );
  }

  return (
    <Scoresheet
      activeView={activeView}
      onToggleView={(view) => setActiveView(view)}
      userEmail={user.email}
      onLogout={handleLogout}
      onOpenReport={handleOpenReport}
    />
  );
}

export default App;
