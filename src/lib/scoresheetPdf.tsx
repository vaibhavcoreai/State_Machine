import React from 'react';
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer';
import type { TeamMatchData } from './stats';
import type { MatchMetadata } from '../components/Header';
import { calculatePoints, calculateTeamScore } from './stats';

const NAVY = '#0B2545'; const ORANGE = '#F28C28'; const TA = '#1F5FBF'; const TB = '#D64550';
const BORDER = '#D9E2EC'; const MUTED = '#64748B'; const LIGHT = '#F8FAFC';

const S = StyleSheet.create({
  page: { backgroundColor: '#fff', padding: 14, fontFamily: 'Helvetica', fontSize: 7.5, color: '#1E293B' },
  hdr: { backgroundColor: NAVY, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 4, marginBottom: 7 },
  hdrL: { flexDirection: 'row', alignItems: 'center' },
  hdrBall: { width: 24, height: 24, borderRadius: 12, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center', marginRight: 7 },
  hdrBallTxt: { fontSize: 10, color: '#fff', fontFamily: 'Helvetica-Bold' },
  hdrSchool: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#fff' },
  hdrSub: { fontSize: 6, color: ORANGE, fontFamily: 'Helvetica-Bold', marginTop: 1 },
  hdrR: { flexDirection: 'row', gap: 16 },
  metaCol: { alignItems: 'flex-end' },
  metaLbl: { fontSize: 5.5, color: '#94A3B8', fontFamily: 'Helvetica-Bold' },
  metaVal: { fontSize: 7.5, color: '#fff', fontFamily: 'Helvetica-Bold' },
  // Scoreboard
  scoreboard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: LIGHT, borderWidth: 1, borderColor: BORDER, borderRadius: 6, paddingVertical: 10, marginBottom: 7, gap: 0 },
  teamSide: { flex: 1, alignItems: 'center' },
  teamSideNm: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY },
  teamSideLbl: { fontSize: 6, fontFamily: 'Helvetica-Bold', marginTop: 1 },
  scoreBig: { fontSize: 36, fontFamily: 'Helvetica-Bold', color: NAVY, minWidth: 60, textAlign: 'center' },
  scoreDash: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: MUTED, paddingHorizontal: 6 },
  qScores: { flexDirection: 'row', gap: 4, marginTop: 5 },
  qBox: { alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 3 },
  qLbl: { fontSize: 5.5, fontFamily: 'Helvetica-Bold', color: MUTED },
  qVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NAVY },
  qFinalBox: { alignItems: 'center', backgroundColor: NAVY, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 3 },
  qFinalLbl: { fontSize: 5.5, fontFamily: 'Helvetica-Bold', color: ORANGE },
  qFinalVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#fff' },
  // Tables
  tables: { flexDirection: 'row', gap: 8 },
  tableWrap: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: BORDER, borderRadius: 6, overflow: 'hidden' },
  tableHdrBar: { paddingHorizontal: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: BORDER },
  tableHdrTxt: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#fff' },
  tHdr: { flexDirection: 'row', backgroundColor: '#EFF4FB', borderBottomWidth: 1, borderBottomColor: BORDER },
  tRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FAFAFA' },
  tTot: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: BORDER, backgroundColor: '#F1F5F9' },
  th: { padding: '2.5 2', fontSize: 6, fontFamily: 'Helvetica-Bold', color: NAVY, textAlign: 'center', borderRightWidth: 1, borderRightColor: BORDER },
  thL: { padding: '2.5 4', fontSize: 6, fontFamily: 'Helvetica-Bold', color: NAVY, textAlign: 'left', borderRightWidth: 1, borderRightColor: BORDER },
  td: { padding: '2.5 2', fontSize: 7, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  tdL: { padding: '2.5 4', fontSize: 7, textAlign: 'left', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  tdB: { padding: '2.5 2', fontSize: 7, fontFamily: 'Helvetica-Bold', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  cPts: { backgroundColor: '#E6F4EA' }, cAst: { backgroundColor: '#FFE8D6' }, cFls: { backgroundColor: '#EDE7F6' },
  cFt: { backgroundColor: '#FEF9C3' }, cStl: { backgroundColor: '#E0F2FE' }, cReb: { backgroundColor: '#E0F2FE' }, cTo: { backgroundColor: '#FEE2E2' },
});

const TeamTable: React.FC<{ side: 'A' | 'B'; team: TeamMatchData }> = ({ side, team }) => {
  const isA = side === 'A';
  const score = calculateTeamScore(team.players);
  const C = { j:20, n:80, p:22, a:22, f:22, m:32, s:22, r:22, t:22 };
  const totals = team.players.reduce((acc,p)=>({ pts:acc.pts+calculatePoints(p), ast:acc.ast+p.ast, fls:acc.fls+p.fls, ftm:acc.ftm+p.ftm, fta:acc.fta+p.fta, fgm:acc.fgm+p.fgm, fga:acc.fga+p.fga, tpm:acc.tpm+p.tpm, tpa:acc.tpa+p.tpa, stl:acc.stl+p.stl, reb:acc.reb+p.reb, to:acc.to+p.to }),
    {pts:0,ast:0,fls:0,ftm:0,fta:0,fgm:0,fga:0,tpm:0,tpa:0,stl:0,reb:0,to:0});
  return (
    <View style={S.tableWrap}>
      <View style={[S.tableHdrBar,{backgroundColor:isA?TA:TB}]}>
        <Text style={S.tableHdrTxt}>{team.name||`Team ${side}`}  —  Score: {score}</Text>
      </View>
      <View style={S.tHdr}>
        <Text style={[S.th,{width:C.j}]}>#</Text><Text style={[S.thL,{width:C.n}]}>Name</Text>
        <Text style={[S.th,{width:C.p},S.cPts]}>PTS</Text><Text style={[S.th,{width:C.a},S.cAst]}>AST</Text>
        <Text style={[S.th,{width:C.f},S.cFls]}>FLS</Text><Text style={[S.th,{width:C.m},S.cFt]}>FT M/A</Text>
        <Text style={[S.th,{width:C.m},S.cFt]}>FG M/A</Text><Text style={[S.th,{width:C.m},S.cFt]}>3P M/A</Text>
        <Text style={[S.th,{width:C.s},S.cStl]}>STL</Text><Text style={[S.th,{width:C.r},S.cReb]}>REB</Text>
        <Text style={[S.th,{width:C.t},S.cTo]}>TO</Text>
      </View>
      {team.players.map((p,i)=>{const pts=calculatePoints(p);return(
        <View key={p.id} style={i%2===0?S.tRow:S.tAlt}>
          <Text style={[S.td,{width:C.j,fontFamily:'Helvetica-Bold',color:NAVY}]}>#{p.jersey}</Text>
          <Text style={[S.tdL,{width:C.n}]}>{p.name}</Text>
          <Text style={[S.td,{width:C.p},S.cPts]}>{pts}</Text><Text style={[S.td,{width:C.a},S.cAst]}>{p.ast}</Text>
          <Text style={[S.td,{width:C.f},S.cFls]}>{p.fls}</Text><Text style={[S.td,{width:C.m},S.cFt]}>{p.ftm}/{p.fta}</Text>
          <Text style={[S.td,{width:C.m},S.cFt]}>{p.fgm}/{p.fga}</Text><Text style={[S.td,{width:C.m},S.cFt]}>{p.tpm}/{p.tpa}</Text>
          <Text style={[S.td,{width:C.s},S.cStl]}>{p.stl}</Text><Text style={[S.td,{width:C.r},S.cReb]}>{p.reb}</Text>
          <Text style={[S.td,{width:C.t},S.cTo]}>{p.to}</Text>
        </View>);})}
      <View style={S.tTot}>
        <Text style={[S.td,{width:C.j}]}> </Text><Text style={[S.tdB,{width:C.n,textAlign:'left',paddingLeft:4}]}>TOTALS</Text>
        <Text style={[S.tdB,{width:C.p},S.cPts]}>{totals.pts}</Text><Text style={[S.tdB,{width:C.a},S.cAst]}>{totals.ast}</Text>
        <Text style={[S.tdB,{width:C.f},S.cFls]}>{totals.fls}</Text><Text style={[S.tdB,{width:C.m},S.cFt]}>{totals.ftm}/{totals.fta}</Text>
        <Text style={[S.tdB,{width:C.m},S.cFt]}>{totals.fgm}/{totals.fga}</Text><Text style={[S.tdB,{width:C.m},S.cFt]}>{totals.tpm}/{totals.tpa}</Text>
        <Text style={[S.tdB,{width:C.s},S.cStl]}>{totals.stl}</Text><Text style={[S.tdB,{width:C.r},S.cReb]}>{totals.reb}</Text>
        <Text style={[S.tdB,{width:C.t},S.cTo]}>{totals.to}</Text>
      </View>
    </View>
  );
};

interface SProps { meta: MatchMetadata; teamA: TeamMatchData; teamB: TeamMatchData; currentQuarter: string; }

export const ScoresheetDocument: React.FC<SProps> = ({ meta, teamA, teamB, currentQuarter }) => {
  const sA = calculateTeamScore(teamA.players); const sB = calculateTeamScore(teamB.players);
  return (
    <Document title="Score Sheet" author="Vidya Valley Stats Machine">
      <Page size="A4" orientation="landscape" style={S.page}>
        <View style={S.hdr}>
          <View style={S.hdrL}>
            <View style={S.hdrBall}><Text style={S.hdrBallTxt}>VV</Text></View>
            <View><Text style={S.hdrSchool}>VIDYA VALLEY SCHOOL</Text><Text style={S.hdrSub}>U-16 NATIONAL BASKETBALL TOURNAMENT — SCORE SHEET</Text></View>
          </View>
          <View style={S.hdrR}>
            {meta.date ? (<View style={S.metaCol}><Text style={S.metaLbl}>DATE</Text><Text style={S.metaVal}>{meta.date}</Text></View>) : null}
            {meta.tipoff ? (<View style={S.metaCol}><Text style={S.metaLbl}>TIP-OFF</Text><Text style={S.metaVal}>{meta.tipoff}</Text></View>) : null}
            {meta.court ? (<View style={S.metaCol}><Text style={S.metaLbl}>COURT</Text><Text style={S.metaVal}>{meta.court}</Text></View>) : null}
            {meta.category ? (<View style={S.metaCol}><Text style={S.metaLbl}>CATEGORY</Text><Text style={S.metaVal}>{meta.category}</Text></View>) : null}
          </View>
        </View>
        <View style={S.scoreboard}>
          <View style={S.teamSide}>
            <Text style={[S.teamSideLbl,{color:TA}]}>TEAM A</Text>
            <Text style={S.teamSideNm}>{teamA.name||'Team A'}</Text>
            <View style={S.qScores}>
              {(['Q1','Q2','Q3','Q4'] as const).map(q=>(
                <View key={q} style={currentQuarter===q?S.qFinalBox:S.qBox}>
                  <Text style={currentQuarter===q?S.qFinalLbl:S.qLbl}>{q}</Text>
                  <Text style={currentQuarter===q?S.qFinalVal:S.qVal}>{teamA.q[q]}</Text>
                </View>))}
              <View style={S.qFinalBox}><Text style={S.qFinalLbl}>FINAL</Text><Text style={S.qFinalVal}>{sA}</Text></View>
            </View>
          </View>
          <Text style={S.scoreBig}>{sA}</Text>
          <Text style={S.scoreDash}>-</Text>
          <Text style={S.scoreBig}>{sB}</Text>
          <View style={S.teamSide}>
            <Text style={[S.teamSideLbl,{color:TB}]}>TEAM B</Text>
            <Text style={S.teamSideNm}>{teamB.name||'Team B'}</Text>
            <View style={S.qScores}>
              {(['Q1','Q2','Q3','Q4'] as const).map(q=>(
                <View key={q} style={currentQuarter===q?S.qFinalBox:S.qBox}>
                  <Text style={currentQuarter===q?S.qFinalLbl:S.qLbl}>{q}</Text>
                  <Text style={currentQuarter===q?S.qFinalVal:S.qVal}>{teamB.q[q]}</Text>
                </View>))}
              <View style={S.qFinalBox}><Text style={S.qFinalLbl}>FINAL</Text><Text style={S.qFinalVal}>{sB}</Text></View>
            </View>
          </View>
        </View>
        <View style={S.tables}>
          <TeamTable side="A" team={teamA}/>
          <TeamTable side="B" team={teamB}/>
        </View>
      </Page>
    </Document>
  );
};

export async function downloadScoresheetPdf(meta: MatchMetadata, teamA: TeamMatchData, teamB: TeamMatchData, currentQuarter: string): Promise<void> {
  const nmA = (teamA.name||'TeamA').replace(/[^a-zA-Z0-9_-]/g,'_');
  const nmB = (teamB.name||'TeamB').replace(/[^a-zA-Z0-9_-]/g,'_');
  const blob = await pdf(<ScoresheetDocument meta={meta} teamA={teamA} teamB={teamB} currentQuarter={currentQuarter}/>).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${nmA}_vs_${nmB}_ScoreSheet.pdf`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
