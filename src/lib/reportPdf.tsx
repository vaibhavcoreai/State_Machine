import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import type { TeamMatchData } from './stats';
import type { MatchMetadata } from '../components/Header';
import {
  calculatePoints,
  calculatePercentage,
  calculateTeamScore,
  calculateTopPerformers,
  calculateTeamTotals,
  determineResult,
} from './stats';

// Palette matching design.md
const NAVY = '#0B2545';
const ORANGE = '#F28C28';
const TA = '#1F5FBF';
const TB = '#D64550';
const BORDER = '#CBD5E1';
const MUTED = '#64748B';
const CARD_BG = '#FFFFFF';
const LIGHT = '#F8FAFC';

// Column widths for 555pt content width
const C = {
  j: 24,
  n: 135,
  p: 38,
  a: 32,
  f: 32,
  m: 60,
  s: 34,
  r: 36,
  t: 34,
};

const S = StyleSheet.create({
  page: {
    backgroundColor: '#F4F7FB',
    padding: 18,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#1E293B',
  },
  // Top Header Banner
  hdr: {
    backgroundColor: NAVY,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 5,
    marginBottom: 6,
  },
  hdrTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hdrL: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hdrBall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 9,
  },
  hdrBallTxt: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
  },
  hdrSchool: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  hdrSub: {
    fontSize: 7,
    color: ORANGE,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    marginTop: 1.5,
  },
  hdrR: {
    alignItems: 'flex-end',
  },
  hdrLbl: {
    fontSize: 6.5,
    color: '#94A3B8',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.6,
  },
  hdrNm: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginTop: 1,
  },

  // Match Metadata Strip inside Report
  metaStrip: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLbl: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  metaVal: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },

  // Match Result Hero Banner
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
  },
  heroL: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shield: {
    width: 32,
    height: 38,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shTxt: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  sideLbl: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  sideNm: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
  },
  scoreCard: {
    backgroundColor: LIGHT,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 5,
    paddingHorizontal: 18,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 160,
  },
  scoreLbl: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    letterSpacing: 0.6,
  },
  scoreVal: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginVertical: 1,
  },
  scoreSub: {
    fontSize: 7,
    color: MUTED,
    fontWeight: 'normal',
  },
  heroR: {
    alignItems: 'flex-end',
    flex: 0.8,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTxt: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
  },

  // Section Header Bar
  secHdr: {
    backgroundColor: LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    letterSpacing: 0.4,
  },

  // Player Stats Table Card
  tableCard: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tHdr: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tTot: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: NAVY,
    backgroundColor: '#EDF2F7',
  },
  th: {
    paddingVertical: 3.5,
    paddingHorizontal: 2,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  thL: {
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  td: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    fontSize: 7,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  tdL: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 7,
    textAlign: 'left',
    fontFamily: 'Helvetica-Bold',
    color: '#1E293B',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  tdB: {
    paddingVertical: 3.5,
    paddingHorizontal: 2,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: BORDER,
    color: NAVY,
  },

  // Stat tints (design.md exact)
  cPts: { backgroundColor: '#E6F4EA' },
  cAst: { backgroundColor: '#FFE8D6' },
  cFls: { backgroundColor: '#EDE7F6' },
  cFt:  { backgroundColor: '#FEF9C3' },
  cFg:  { backgroundColor: '#FEF9C3' },
  c3p:  { backgroundColor: '#FEF9C3' },
  cStl: { backgroundColor: '#E0F2FE' },
  cReb: { backgroundColor: '#E0F2FE' },
  cTo:  { backgroundColor: '#FEE2E2' },

  // Middle Row: Shooting Summary & Quarter Breakdown
  midRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  shootCard: {
    flex: 1.15,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    overflow: 'hidden',
  },
  shootBody: {
    padding: 8,
  },
  shootRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  meterWrap: {
    flex: 1,
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 5,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  meterPct: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  meterBarBg: {
    width: 54,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: 2.5,
  },
  meterBarFill: {
    height: 4,
    borderRadius: 2,
  },
  meterLbl: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginTop: 1,
  },
  meterSub: {
    fontSize: 6,
    color: MUTED,
    marginTop: 1,
  },

  // Quarter Breakdown Card
  qCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    overflow: 'hidden',
  },
  qTh: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  qThL: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'left',
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  qTd: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontSize: 7.5,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    width: 32,
  },
  qTdL: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    fontSize: 7.5,
    textAlign: 'left',
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  qTdB: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    width: 38,
    backgroundColor: '#EDF2F7',
    color: NAVY,
  },

  // Bottom Row: Key Team Metrics & Top Performers
  botRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  metricsCard: {
    flex: 1.3,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    overflow: 'hidden',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
    justifyContent: 'space-between',
  },
  metricBox: {
    width: '31.8%',
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 3,
    alignItems: 'center',
    marginBottom: 5,
  },
  metricLbl: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    letterSpacing: 0.5,
  },
  metricVal: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginTop: 1,
  },

  // Top Performers Card
  topCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 5,
    overflow: 'hidden',
  },
  topBody: {
    padding: 6,
    justifyContent: 'space-around',
    flex: 1,
  },
  topItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4.5,
    marginBottom: 4,
  },
  topItemL: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topPill: {
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 3,
    marginRight: 5,
  },
  topPillTxt: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  topVal: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'right',
    maxWidth: 125,
  },

  // Footer note
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 3,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerTxt: {
    fontSize: 6,
    color: MUTED,
  },
});

const Meter: React.FC<{ label: string; pctStr: string; made: number; att: number; color: string }> = ({
  label,
  pctStr,
  made,
  att,
  color,
}) => {
  const pct = att > 0 ? Math.min(100, Math.round((made / att) * 100)) : 0;
  const barWidth = Math.round((pct / 100) * 54);

  return (
    <View style={S.meterWrap}>
      <Text style={[S.meterPct, { color }]}>{pctStr}</Text>
      <View style={S.meterBarBg}>
        <View style={[S.meterBarFill, { backgroundColor: color, width: barWidth }]} />
      </View>
      <Text style={S.meterLbl}>{label}</Text>
      <Text style={S.meterSub}>
        {made} / {att} ({pct}%)
      </Text>
    </View>
  );
};

export const ReportDocument: React.FC<{
  side: 'A' | 'B';
  teamA: TeamMatchData;
  teamB: TeamMatchData;
  meta?: MatchMetadata | null;
}> = ({ side, teamA, teamB, meta }) => {
  const isA = side === 'A';
  const sel = isA ? teamA : teamB;

  const scoreA = calculateTeamScore(teamA.players);
  const scoreB = calculateTeamScore(teamB.players);
  const selScore = isA ? scoreA : scoreB;
  const oppScore = isA ? scoreB : scoreA;

  const res = determineResult(selScore, oppScore);
  const tot = calculateTeamTotals(sel.players);
  const tops = calculateTopPerformers(sel.players);
  const acc = isA ? TA : TB;

  const [bbg, bfg, bbd] =
    res === 'WIN'
      ? ['#DCFCE7', '#166534', '#1E9E4A']
      : res === 'LOSS'
      ? ['#FEE2E2', '#B91C1C', TB]
      : ['#F1F5F9', '#475569', '#94A3B8'];

  // Advanced derived stats
  const fgPctStr = calculatePercentage(tot.fgm, tot.fga);
  const tpPctStr = calculatePercentage(tot.tpm, tot.tpa);
  const ftPctStr = calculatePercentage(tot.ftm, tot.fta);

  // 2-point shooting
  const twoMade = tot.fgm - tot.tpm;
  const twoAtt = tot.fga - tot.tpa;
  const twoPctStr = calculatePercentage(twoMade, twoAtt);

  // Assist-to-turnover ratio
  const astToRatio = tot.turnovers > 0 ? (tot.assists / tot.turnovers).toFixed(2) : tot.assists > 0 ? '∞' : '0.00';

  // Points from 2P, 3P, FT
  const pts2p = twoMade * 2;
  const pts3p = tot.tpm * 3;
  const ptsFt = tot.ftm;

  return (
    <Document title={`${sel.name || `Team ${side}`} Performance Report`} author="Vidya Valley Stats Machine">
      {/* Vertical A4 Page: size="A4" orientation="portrait" */}
      <Page size="A4" orientation="portrait" style={S.page}>
        {/* 1. Header Banner */}
        <View style={S.hdr}>
          <View style={S.hdrTop}>
            <View style={S.hdrL}>
              <View style={S.hdrBall}>
                <Text style={S.hdrBallTxt}>VV</Text>
              </View>
              <View>
                <Text style={S.hdrSchool}>VIDYA VALLEY SCHOOL</Text>
                <Text style={S.hdrSub}>U-16 NATIONAL BASKETBALL TOURNAMENT</Text>
              </View>
            </View>
            <View style={S.hdrR}>
              <Text style={S.hdrLbl}>TEAM STATISTICAL PERFORMANCE REPORT</Text>
              <Text style={S.hdrNm}>{(sel.name || `Team ${side}`).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* 2. Match Details & Officials Strip */}
        <View style={S.metaStrip}>
          <View style={S.metaItem}>
            <Text style={S.metaLbl}>DATE (DD/MM/YYYY)</Text>
            <Text style={S.metaVal}>{meta?.date || '—'}</Text>
          </View>
          <View style={S.metaItem}>
            <Text style={S.metaLbl}>TIP-OFF</Text>
            <Text style={S.metaVal}>{meta?.tipoff || '—'}</Text>
          </View>
          <View style={S.metaItem}>
            <Text style={S.metaLbl}>COURT</Text>
            <Text style={S.metaVal}>{meta?.court ? String(meta.court) : 'Court 1'}</Text>
          </View>
          <View style={S.metaItem}>
            <Text style={S.metaLbl}>CATEGORY</Text>
            <Text style={S.metaVal}>{meta?.category || 'Boys U-16'}</Text>
          </View>
          <View style={S.metaItem}>
            <Text style={S.metaLbl}>STATISTICIAN 1</Text>
            <Text style={S.metaVal}>{meta?.statistician1 || '—'}</Text>
          </View>
          <View style={S.metaItem}>
            <Text style={S.metaLbl}>STATISTICIAN 2</Text>
            <Text style={S.metaVal}>{meta?.statistician2 || '—'}</Text>
          </View>
        </View>

        {/* 3. Match Result Hero Banner */}
        <View style={S.hero}>
          <View style={S.heroL}>
            <View style={[S.shield, { backgroundColor: acc }]}>
              <Text style={S.shTxt}>{side}</Text>
            </View>
            <View>
              <Text style={[S.sideLbl, { color: acc }]}>TEAM {side}</Text>
              <Text style={S.sideNm}>{sel.name || `Team ${side}`}</Text>
            </View>
          </View>

          <View style={S.scoreCard}>
            <Text style={S.scoreLbl}>FINAL SCORE</Text>
            <Text style={S.scoreVal}>
              {scoreA} - {scoreB}
            </Text>
            <Text style={S.scoreSub}>
              {teamA.name || 'Team A'} vs {teamB.name || 'Team B'}
            </Text>
          </View>

          <View style={S.heroR}>
            <View style={[S.badge, { backgroundColor: bbg, borderColor: bbd }]}>
              <Text style={[S.badgeTxt, { color: bfg }]}>{res}</Text>
            </View>
          </View>
        </View>

        {/* 4. Individual Player Statistics Table */}
        <View style={S.tableCard}>
          <Text style={S.secHdr}>INDIVIDUAL PLAYER STATISTICS</Text>
          <View style={S.tHdr}>
            <Text style={[S.th, { width: C.j }]}>#</Text>
            <Text style={[S.thL, { width: C.n }]}>Player Name</Text>
            <Text style={[S.th, { width: C.p }, S.cPts]}>PTS</Text>
            <Text style={[S.th, { width: C.a }, S.cAst]}>AST</Text>
            <Text style={[S.th, { width: C.f }, S.cFls]}>FLS</Text>
            <Text style={[S.th, { width: C.m }, S.cFt]}>FT M/A</Text>
            <Text style={[S.th, { width: C.m }, S.cFg]}>FG M/A</Text>
            <Text style={[S.th, { width: C.m }, S.c3p]}>3P M/A</Text>
            <Text style={[S.th, { width: C.s }, S.cStl]}>STL</Text>
            <Text style={[S.th, { width: C.r }, S.cReb]}>REB</Text>
            <Text style={[S.th, { width: C.t }, S.cTo]}>TO</Text>
          </View>

          {sel.players.map((p, i) => {
            const pts = calculatePoints(p);
            return (
              <View key={p.id} style={i % 2 === 0 ? S.tRow : S.tAlt}>
                <Text style={[S.td, { width: C.j, fontFamily: 'Helvetica-Bold', color: NAVY }]}>#{p.jersey}</Text>
                <Text style={[S.tdL, { width: C.n }]}>{p.name}</Text>
                <Text style={[S.td, { width: C.p }, S.cPts, { fontFamily: 'Helvetica-Bold' }]}>{pts}</Text>
                <Text style={[S.td, { width: C.a }, S.cAst]}>{p.ast}</Text>
                <Text style={[S.td, { width: C.f }, S.cFls]}>{p.fls}</Text>
                <Text style={[S.td, { width: C.m }, S.cFt]}>
                  {p.ftm}/{p.fta}
                </Text>
                <Text style={[S.td, { width: C.m }, S.cFg]}>
                  {p.fgm}/{p.fga}
                </Text>
                <Text style={[S.td, { width: C.m }, S.c3p]}>
                  {p.tpm}/{p.tpa}
                </Text>
                <Text style={[S.td, { width: C.s }, S.cStl]}>{p.stl}</Text>
                <Text style={[S.td, { width: C.r }, S.cReb]}>{p.reb}</Text>
                <Text style={[S.td, { width: C.t }, S.cTo]}>{p.to}</Text>
              </View>
            );
          })}

          {/* Totals Row */}
          <View style={S.tTot}>
            <Text style={[S.td, { width: C.j }]}> </Text>
            <Text style={[S.tdB, { width: C.n, textAlign: 'left', paddingLeft: 6 }]}>TEAM TOTALS</Text>
            <Text style={[S.tdB, { width: C.p }, S.cPts]}>{tot.points}</Text>
            <Text style={[S.tdB, { width: C.a }, S.cAst]}>{tot.assists}</Text>
            <Text style={[S.tdB, { width: C.f }, S.cFls]}>{tot.fouls}</Text>
            <Text style={[S.tdB, { width: C.m }, S.cFt]}>
              {tot.ftm}/{tot.fta}
            </Text>
            <Text style={[S.tdB, { width: C.m }, S.cFg]}>
              {tot.fgm}/{tot.fga}
            </Text>
            <Text style={[S.tdB, { width: C.m }, S.c3p]}>
              {tot.tpm}/{tot.tpa}
            </Text>
            <Text style={[S.tdB, { width: C.s }, S.cStl]}>{tot.steals}</Text>
            <Text style={[S.tdB, { width: C.r }, S.cReb]}>{tot.rebounds}</Text>
            <Text style={[S.tdB, { width: C.t }, S.cTo]}>{tot.turnovers}</Text>
          </View>
        </View>

        {/* 5. Middle Row: Shooting Efficiency Breakdown & Quarter Progression */}
        <View style={S.midRow}>
          {/* Shooting Efficiency */}
          <View style={S.shootCard}>
            <Text style={S.secHdr}>SHOOTING ACCURACY & EFFICIENCY</Text>
            <View style={S.shootBody}>
              <View style={S.shootRow}>
                <Meter label="Field Goals (FG%)" pctStr={fgPctStr} made={tot.fgm} att={tot.fga} color={TA} />
                <Meter label="3-Pointers (3P%)" pctStr={tpPctStr} made={tot.tpm} att={tot.tpa} color={ORANGE} />
                <Meter label="Free Throws (FT%)" pctStr={ftPctStr} made={tot.ftm} att={tot.fta} color="#1E9E4A" />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3, paddingHorizontal: 3 }}>
                <Text style={{ fontSize: 6.2, color: MUTED }}>
                  2PT: <Text style={{ fontFamily: 'Helvetica-Bold', color: NAVY }}>{twoMade}/{twoAtt} ({twoPctStr})</Text>
                </Text>
                <Text style={{ fontSize: 6.2, color: MUTED }}>
                  Pts Distribution: <Text style={{ fontFamily: 'Helvetica-Bold', color: NAVY }}>2P: {pts2p} | 3P: {pts3p} | FT: {ptsFt}</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* Quarter Scores Progression */}
          <View style={S.qCard}>
            <Text style={S.secHdr}>QUARTER-BY-QUARTER PROGRESSION</Text>
            <View style={S.tHdr}>
              <Text style={S.qThL}>Team</Text>
              <Text style={S.qTh}>Q1</Text>
              <Text style={S.qTh}>Q2</Text>
              <Text style={S.qTh}>Q3</Text>
              <Text style={S.qTh}>Q4</Text>
              <Text style={[S.qTh, { width: 38, backgroundColor: '#EDF2F7' }]}>FINAL</Text>
            </View>
            <View style={[S.tRow, isA ? { backgroundColor: '#EFF6FF' } : {}]}>
              <Text style={[S.qTdL, { fontFamily: isA ? 'Helvetica-Bold' : 'Helvetica', color: isA ? TA : '#1E293B' }]}>
                {teamA.name || 'Team A'} {isA ? '★ (Selected)' : ''}
              </Text>
              <Text style={S.qTd}>{teamA.q.Q1}</Text>
              <Text style={S.qTd}>{teamA.q.Q2}</Text>
              <Text style={S.qTd}>{teamA.q.Q3}</Text>
              <Text style={S.qTd}>{teamA.q.Q4}</Text>
              <Text style={S.qTdB}>{scoreA}</Text>
            </View>
            <View style={[S.tRow, !isA ? { backgroundColor: '#FEF2F2' } : {}]}>
              <Text style={[S.qTdL, { fontFamily: !isA ? 'Helvetica-Bold' : 'Helvetica', color: !isA ? TB : '#1E293B' }]}>
                {teamB.name || 'Team B'} {!isA ? '★ (Selected)' : ''}
              </Text>
              <Text style={S.qTd}>{teamB.q.Q1}</Text>
              <Text style={S.qTd}>{teamB.q.Q2}</Text>
              <Text style={S.qTd}>{teamB.q.Q3}</Text>
              <Text style={S.qTd}>{teamB.q.Q4}</Text>
              <Text style={S.qTdB}>{scoreB}</Text>
            </View>
          </View>
        </View>

        {/* 6. Bottom Row: Key Team Statistics & Top Performers */}
        <View style={S.botRow}>
          {/* Key Team Statistics */}
          <View style={S.metricsCard}>
            <Text style={S.secHdr}>KEY TEAM METRICS & PERFORMANCE</Text>
            <View style={S.metricsGrid}>
              <View style={S.metricBox}>
                <Text style={S.metricLbl}>TOTAL POINTS</Text>
                <Text style={[S.metricVal, { color: '#166534' }]}>{tot.points}</Text>
              </View>
              <View style={S.metricBox}>
                <Text style={S.metricLbl}>TOTAL REBOUNDS</Text>
                <Text style={S.metricVal}>{tot.rebounds}</Text>
              </View>
              <View style={S.metricBox}>
                <Text style={S.metricLbl}>TOTAL ASSISTS</Text>
                <Text style={S.metricVal}>{tot.assists}</Text>
              </View>
              <View style={S.metricBox}>
                <Text style={S.metricLbl}>TOTAL STEALS</Text>
                <Text style={S.metricVal}>{tot.steals}</Text>
              </View>
              <View style={S.metricBox}>
                <Text style={S.metricLbl}>TOTAL TURNOVERS</Text>
                <Text style={[S.metricVal, { color: TB }]}>{tot.turnovers}</Text>
              </View>
              <View style={S.metricBox}>
                <Text style={S.metricLbl}>PERSONAL FOULS</Text>
                <Text style={[S.metricVal, { color: '#6B21A8' }]}>{tot.fouls}</Text>
              </View>
            </View>
          </View>

          {/* Top Performers */}
          <View style={S.topCard}>
            <Text style={S.secHdr}>TOP PERFORMERS</Text>
            <View style={S.topBody}>
              <View style={S.topItem}>
                <View style={S.topItemL}>
                  <View style={[S.topPill, { backgroundColor: '#166534' }]}>
                    <Text style={S.topPillTxt}>PTS</Text>
                  </View>
                  <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: MUTED }}>SCORING LEADER</Text>
                </View>
                <Text style={S.topVal}>{tops.points}</Text>
              </View>

              <View style={S.topItem}>
                <View style={S.topItemL}>
                  <View style={[S.topPill, { backgroundColor: TA }]}>
                    <Text style={S.topPillTxt}>REB</Text>
                  </View>
                  <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: MUTED }}>REBOUND LEADER</Text>
                </View>
                <Text style={S.topVal}>{tops.rebounds}</Text>
              </View>

              <View style={S.topItem}>
                <View style={S.topItemL}>
                  <View style={[S.topPill, { backgroundColor: ORANGE }]}>
                    <Text style={S.topPillTxt}>AST</Text>
                  </View>
                  <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: MUTED }}>PLAYMAKER</Text>
                </View>
                <Text style={S.topVal}>{tops.assists}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 3, paddingTop: 1 }}>
                <Text style={{ fontSize: 6.2, color: MUTED }}>
                  AST / TO Ratio: <Text style={{ fontFamily: 'Helvetica-Bold', color: NAVY }}>{astToRatio}</Text>
                </Text>
                <Text style={{ fontSize: 6.2, color: MUTED }}>
                  Net Differential: <Text style={{ fontFamily: 'Helvetica-Bold', color: selScore >= oppScore ? '#166534' : TB }}>
                    {selScore - oppScore > 0 ? `+${selScore - oppScore}` : `${selScore - oppScore}`}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 7. Footer Note */}
        <View style={S.footer}>
          <Text style={S.footerTxt}>Official Statistical Report • Vidya Valley U-16 National Basketball Tournament</Text>
          <Text style={S.footerTxt}>Format: Vertical A4 • Generated via Vidya Valley Stats Machine</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function downloadReportPdf(
  side: 'A' | 'B',
  teamA: TeamMatchData,
  teamB: TeamMatchData,
  meta?: MatchMetadata | null
): Promise<void> {
  const sel = side === 'A' ? teamA : teamB;
  const nm = (sel.name || `Team_${side}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const blob = await pdf(<ReportDocument side={side} teamA={teamA} teamB={teamB} meta={meta} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nm}_Statistical_Report_A4.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
