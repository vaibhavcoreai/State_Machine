import React, { useState } from 'react';
import {
  calculatePoints,
  calculatePercentage,
  calculatePercentageNumber,
  calculateTeamScore,
  calculateTopPerformers,
  calculateTeamTotals,
  determineResult,
  type TeamMatchData,
} from '../lib/stats';
import type { MatchMetadata } from './Header';
import { downloadReportPdf } from '../lib/reportPdf';

interface ReportProps {
  side: 'A' | 'B';
  teamA: TeamMatchData;
  teamB: TeamMatchData;
  meta?: MatchMetadata | null;
  onBack: () => void;
}

export const Report: React.FC<ReportProps> = ({ side, teamA, teamB, meta, onBack }) => {
  const [pdfLoading, setPdfLoading] = useState(false);
  const isTeamA = side === 'A';
  const selectedTeam = isTeamA ? teamA : teamB;

  const scoreA = calculateTeamScore(teamA.players);
  const scoreB = calculateTeamScore(teamB.players);
  const selectedScore = isTeamA ? scoreA : scoreB;
  const opponentScore = isTeamA ? scoreB : scoreA;

  const resultBadge = determineResult(selectedScore, opponentScore);

  const teamTotals = calculateTeamTotals(selectedTeam.players);
  const topPerformers = calculateTopPerformers(selectedTeam.players);

  // Shooting percentages
  const fgPctStr = calculatePercentage(teamTotals.fgm, teamTotals.fga);
  const fgPctNum = calculatePercentageNumber(teamTotals.fgm, teamTotals.fga) || 0;

  const tpPctStr = calculatePercentage(teamTotals.tpm, teamTotals.tpa);
  const tpPctNum = calculatePercentageNumber(teamTotals.tpm, teamTotals.tpa) || 0;

  const ftPctStr = calculatePercentage(teamTotals.ftm, teamTotals.fta);
  const ftPctNum = calculatePercentageNumber(teamTotals.ftm, teamTotals.fta) || 0;

  // SVG Donut Ring Helper
  const renderDonut = (pctNum: number, label: string, pctStr: string, made: number, att: number, strokeColor: string) => {
    const radius = 28;
    const circ = 2 * Math.PI * radius;
    const strokeDashoffset = circ - (pctNum / 100) * circ;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px' }}>
        <div style={{ position: 'relative', width: '70px', height: '70px' }}>
          <svg width="70" height="70" viewBox="0 0 70 70">
            <circle
              cx="35"
              cy="35"
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth="6"
            />
            <circle
              cx="35"
              cy="35"
              r={radius}
              fill="transparent"
              stroke={strokeColor}
              strokeWidth="6"
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 35 35)"
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.85rem',
            color: 'var(--navy)'
          }}>
            {pctStr}
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {made} / {att}
        </div>
      </div>
    );
  };

  return (
    <div className="team-report-page" style={{
      maxWidth: '1200px',
      margin: '0 auto',
      background: '#ffffff',
      color: 'var(--text-main)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print" style={{
        background: '#F1F5F9',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--card-border)'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--navy)',
            color: '#ffffff',
            border: 'none',
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ← Back to Scoresheet
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)' }}>
            Viewing Report: {selectedTeam.name || `Team ${side}`}
          </span>
          <button
            onClick={async () => {
              setPdfLoading(true);
              try { await downloadReportPdf(side, teamA, teamB, meta); }
              finally { setPdfLoading(false); }
            }}
            disabled={pdfLoading}
            style={{
              background: 'var(--orange)',
              color: '#ffffff',
              border: 'none',
              padding: '0.4rem 0.85rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: pdfLoading ? 'not-allowed' : 'pointer',
              opacity: pdfLoading ? 0.7 : 1,
            }}
          >
            {pdfLoading ? '⏳ Generating PDF…' : '📄 Export PDF'}
          </button>
        </div>
      </div>

      {/* Navy Header per design.md:
          logo + "VIDYA VALLEY SCHOOL / U-16 NATIONAL BASKETBALL TOURNAMENT" left;
          "TEAM STATISTICS REPORT / {TEAM NAME}" right.
          NO date, court, category, medals, trophies.
      */}
      <header style={{
        background: 'var(--navy)',
        color: '#ffffff',
        padding: '0.85rem 1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            <h1 style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.05em' }}>
              VIDYA VALLEY SCHOOL
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--orange)', fontWeight: 700 }}>
              U-16 NATIONAL BASKETBALL TOURNAMENT
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em' }}>
            TEAM STATISTICS REPORT
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>
            {selectedTeam.name || `TEAM ${side}`}
          </div>
        </div>
      </header>

      {/* Metadata strip: Date, Tip-off, Court, Category, Statisticians */}
      {meta && (
        <div style={{
          background: '#F8FAFC',
          borderBottom: '1px solid var(--card-border)',
          padding: '0.6rem 1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          alignItems: 'center',
          fontSize: '0.8rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', display: 'block' }}>Date (DD/MM/YYYY)</span>
            <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{meta.date || '—'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', display: 'block' }}>Tip-off</span>
            <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{meta.tipoff || '—'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', display: 'block' }}>Court</span>
            <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{meta.court ? String(meta.court) : 'Court 1'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', display: 'block' }}>Category</span>
            <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{meta.category || 'Boys U-16'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', display: 'block' }}>Statistician 1</span>
            <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{meta.statistician1 || '—'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', display: 'block' }}>Statistician 2</span>
            <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{meta.statistician2 || '—'}</span>
          </div>
        </div>
      )}

      {/* Content Body */}
      <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
        {/* ROW 1: Shield + Title; FINAL SCORE card "{A score} - {B score}", both team names under, WIN/LOSS/TIE badge */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC',
          border: '1px solid var(--card-border)',
          borderRadius: '8px',
          padding: '1rem 1.5rem'
        }}>
          {/* Shield + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={`team-shield ${isTeamA ? 'team-a' : 'team-b'}`} style={{ width: '44px', height: '52px', fontSize: '1.25rem' }}>
              {side}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isTeamA ? 'var(--team-a-blue)' : 'var(--team-b-red)', textTransform: 'uppercase' }}>
                TEAM {side}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)' }}>
                {selectedTeam.name || `Team ${side}`}
              </h2>
            </div>
          </div>

          {/* FINAL SCORE Card */}
          <div style={{
            background: '#ffffff',
            border: '2px solid var(--card-border)',
            borderRadius: '8px',
            padding: '0.6rem 1.5rem',
            textAlign: 'center',
            minWidth: '220px'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              FINAL SCORE
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--navy)', fontVariantNumeric: 'tabular-nums' }}>
              {scoreA} - {scoreB}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {teamA.name || 'Team A'} vs {teamB.name || 'Team B'}
            </div>
          </div>

          {/* WIN / LOSS / TIE Badge */}
          <div>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1.5rem',
              borderRadius: '6px',
              fontWeight: 900,
              fontSize: '1.2rem',
              letterSpacing: '0.05em',
              background: resultBadge === 'WIN' ? '#DCFCE7' : resultBadge === 'LOSS' ? '#FEE2E2' : '#F1F5F9',
              color: resultBadge === 'WIN' ? '#166534' : resultBadge === 'LOSS' ? 'var(--error)' : '#475569',
              border: `2px solid ${resultBadge === 'WIN' ? '#1E9E4A' : resultBadge === 'LOSS' ? 'var(--error)' : '#CBD5E1'}`
            }}>
              {resultBadge}
            </div>
          </div>
        </div>

        {/* ROW 2:
            Left: Individual Player Statistics table (# jersey, Name, PTS, AST, FLS, FT M/A, FG M/A, 3P M/A, STL, REB, TO), selected team only.
            Right: Shooting Summary (3 donut rings: FG%, 3P%, FT% with made/attempted below) above Quarter table (Q1-Q4 + Final, both teams).
        */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* Row 2 Left: Individual Player Statistics */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#F8FAFC',
              padding: '0.6rem 1rem',
              borderBottom: '1px solid var(--card-border)',
              fontWeight: 800,
              fontSize: '0.9rem',
              color: 'var(--navy)'
            }}>
              INDIVIDUAL PLAYER STATISTICS
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="stat-table tabular-nums">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ minWidth: '110px', textAlign: 'left', paddingLeft: '0.5rem' }}>Name</th>
                    <th style={{ width: '38px' }} className="cell-pts">PTS</th>
                    <th style={{ width: '36px' }} className="cell-ast">AST</th>
                    <th style={{ width: '36px' }} className="cell-fls">FLS</th>
                    <th style={{ width: '60px' }} className="cell-ft">FT M/A</th>
                    <th style={{ width: '60px' }} className="cell-fg">FG M/A</th>
                    <th style={{ width: '60px' }} className="cell-3p">3P M/A</th>
                    <th style={{ width: '36px' }} className="cell-stl">STL</th>
                    <th style={{ width: '36px' }} className="cell-reb">REB</th>
                    <th style={{ width: '36px' }} className="cell-to">TO</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTeam.players.map((p) => {
                    const pts = calculatePoints(p);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: 'var(--navy)' }}>#{p.jersey}</td>
                        <td style={{ textAlign: 'left', paddingLeft: '0.5rem', fontWeight: 600 }}>{p.name}</td>
                        <td className="cell-pts">{pts}</td>
                        <td className="cell-ast">{p.ast}</td>
                        <td className="cell-fls">{p.fls}</td>
                        <td className="cell-ft">{p.ftm}/{p.fta}</td>
                        <td className="cell-fg">{p.fgm}/{p.fga}</td>
                        <td className="cell-3p">{p.tpm}/{p.tpa}</td>
                        <td className="cell-stl">{p.stl}</td>
                        <td className="cell-reb">{p.reb}</td>
                        <td className="cell-to">{p.to}</td>
                      </tr>
                    );
                  })}
                  {/* Team Totals Row */}
                  <tr style={{ background: '#F1F5F9', fontWeight: 800, borderTop: '2px solid var(--card-border)' }}>
                    <td></td>
                    <td style={{ textAlign: 'left', paddingLeft: '0.5rem' }}>TOTALS</td>
                    <td className="cell-pts">{teamTotals.points}</td>
                    <td className="cell-ast">{teamTotals.assists}</td>
                    <td className="cell-fls">{teamTotals.fouls}</td>
                    <td className="cell-ft">{teamTotals.ftm}/{teamTotals.fta}</td>
                    <td className="cell-fg">{teamTotals.fgm}/{teamTotals.fga}</td>
                    <td className="cell-3p">{teamTotals.tpm}/{teamTotals.tpa}</td>
                    <td className="cell-stl">{teamTotals.steals}</td>
                    <td className="cell-reb">{teamTotals.rebounds}</td>
                    <td className="cell-to">{teamTotals.turnovers}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 2 Right: Shooting Summary + Quarter Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Shooting Summary */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.85rem',
                fontWeight: 800,
                color: 'var(--navy)',
                marginBottom: '0.75rem',
                textAlign: 'left'
              }}>
                SHOOTING SUMMARY
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                {renderDonut(fgPctNum, 'FG%', fgPctStr, teamTotals.fgm, teamTotals.fga, '#1F5FBF')}
                {renderDonut(tpPctNum, '3P%', tpPctStr, teamTotals.tpm, teamTotals.tpa, '#F28C28')}
                {renderDonut(ftPctNum, 'FT%', ftPctStr, teamTotals.ftm, teamTotals.fta, '#1E9E4A')}
              </div>
            </div>

            {/* Quarter Table (Q1-Q4 + Final, both teams) */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: '#F8FAFC',
                padding: '0.6rem 1rem',
                borderBottom: '1px solid var(--card-border)',
                fontWeight: 800,
                fontSize: '0.85rem',
                color: 'var(--navy)'
              }}>
                QUARTER SCORES
              </div>
              <table className="stat-table tabular-nums">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', paddingLeft: '0.75rem' }}>Team</th>
                    <th>Q1</th>
                    <th>Q2</th>
                    <th>Q3</th>
                    <th>Q4</th>
                    <th style={{ fontWeight: 800, background: '#E2E8F0' }}>Final</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ fontWeight: isTeamA ? 700 : 400 }}>
                    <td style={{ textAlign: 'left', paddingLeft: '0.75rem' }}>
                      {teamA.name || 'Team A'} {isTeamA ? '★' : ''}
                    </td>
                    <td>{teamA.q.Q1}</td>
                    <td>{teamA.q.Q2}</td>
                    <td>{teamA.q.Q3}</td>
                    <td>{teamA.q.Q4}</td>
                    <td style={{ fontWeight: 800, background: '#F1F5F9' }}>{scoreA}</td>
                  </tr>
                  <tr style={{ fontWeight: !isTeamA ? 700 : 400 }}>
                    <td style={{ textAlign: 'left', paddingLeft: '0.75rem' }}>
                      {teamB.name || 'Team B'} {!isTeamA ? '★' : ''}
                    </td>
                    <td>{teamB.q.Q1}</td>
                    <td>{teamB.q.Q2}</td>
                    <td>{teamB.q.Q3}</td>
                    <td>{teamB.q.Q4}</td>
                    <td style={{ fontWeight: 800, background: '#F1F5F9' }}>{scoreB}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ROW 3:
            Left: Key Team Statistics cards (Points, Rebounds, Assists, Turnovers, Fouls, Steals).
            Right: Top Performers (most PTS, REB, AST; ties show all names comma-separated; all-zero shows "—").
        */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '1.25rem', alignItems: 'stretch' }}>
          {/* Key Team Statistics cards */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.75rem' }}>
              KEY TEAM STATISTICS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>POINTS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)' }}>{teamTotals.points}</div>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>REBOUNDS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)' }}>{teamTotals.rebounds}</div>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>ASSISTS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)' }}>{teamTotals.assists}</div>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>TURNOVERS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)' }}>{teamTotals.turnovers}</div>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>FOULS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)' }}>{teamTotals.fouls}</div>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.6rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>STEALS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)' }}>{teamTotals.steals}</div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.75rem' }}>
              TOP PERFORMERS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>MOST PTS</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', textAlign: 'right' }}>
                  {topPerformers.points}
                </span>
              </div>

              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>MOST REB</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', textAlign: 'right' }}>
                  {topPerformers.rebounds}
                </span>
              </div>

              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>MOST AST</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', textAlign: 'right' }}>
                  {topPerformers.assists}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
