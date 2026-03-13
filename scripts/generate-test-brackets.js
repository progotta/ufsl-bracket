#!/usr/bin/env node
// Generate test bracket data for 6 personas
// Outputs SQL to insert profiles, pool, pool_members, brackets

const T = (region, seed) => {
  const regionMap = { E: '0001', W: '0002', S: '0003', M: '0004' };
  return `00000000-0000-0000-${regionMap[region]}-${String(seed).padStart(12, '0')}`;
};

// R1 matchups in order: [higher_seed, lower_seed] per region
// Matchup order: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
const MATCHUPS = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]];
const REGIONS = [
  { code: 'E', name: 'east', idx: 0 },
  { code: 'W', name: 'west', idx: 1 },
  { code: 'S', name: 'south', idx: 2 },
  { code: 'M', name: 'midwest', idx: 3 },
];

// Actual results
const ACTUAL = {};

// Build actual R1 winners
const R1_WINNERS = {
  E: [1,9,5,4,6,3,10,2],   // Duke,Baylor,Oregon,Arizona,BYU,Wisconsin,Vanderbilt,Alabama
  W: [1,9,12,4,6,3,10,2],  // Florida,Oklahoma,UCSD,Maryland,Missouri,TTU,CSU,StJohns
  S: [1,8,5,4,6,3,7,2],    // Auburn,Creighton,Michigan,TAMU,OleMiss,IowaState,Louisville,MichState
  M: [1,8,5,4,11,3,7,2],   // Houston,Gonzaga,Clemson,Purdue,McNeese,Kentucky,KState,Tennessee
};

// Build game IDs
function gid(region, round, gameNum) {
  return `${region}-r${round}-g${gameNum}`;
}

// Map R1 game numbers (per region: regionIdx*8 + matchupIdx + 1)
REGIONS.forEach(r => {
  MATCHUPS.forEach((_, mi) => {
    const gameNum = r.idx * 8 + mi + 1;
    const winner = R1_WINNERS[r.code][mi];
    ACTUAL[gid(r.name, 1, gameNum)] = T(r.code, winner);
  });
});

// R2 winners by region
const R2_WINNERS = {
  E: [1,4,3,2],    // Duke, Arizona, Wisconsin, Alabama
  W: [1,4,3,2],    // Florida, Maryland, TTexTech, StJohns
  S: [1,5,3,2],    // Auburn, Michigan, IowaState, MichState
  M: [1,4,3,2],    // Houston, Purdue, Kentucky, Tennessee
};

REGIONS.forEach(r => {
  for (let i = 0; i < 4; i++) {
    const gameNum = r.idx * 4 + i + 1;
    const winner = R2_WINNERS[r.code][i];
    ACTUAL[gid(r.name, 2, gameNum)] = T(r.code, winner);
  }
});

// Sweet 16 winners (these are NOT scored yet, but we need them for bracket paths)
const S16_WINNERS = {
  E: [1,2],    // Duke, Alabama
  W: [1,2],    // Florida, StJohns
  S: [1,2],    // Auburn, MichState
  M: [1,2],    // Houston, Tennessee
};

// Elite 8 winners: Duke, Florida, Auburn, Houston
// FF: Duke over Florida (ff-r5-g1 is East vs West), Houston over Auburn (ff-r5-g2 is South vs Midwest)
// Wait - in bracket.ts: ff-r5-g1 slot1=East, slot2=West; ff-r5-g2 slot1=South, slot2=Midwest
// Championship: Duke over Houston

// Helper: build a full bracket from a strategy
function buildBracket(r1Picks, r2Strategy, s16Strategy, e8Strategy, ffStrategy, champStrategy) {
  const picks = {};

  // R1: r1Picks[regionCode] = array of 8 seed numbers (winner of each matchup)
  REGIONS.forEach(r => {
    MATCHUPS.forEach((matchup, mi) => {
      const gameNum = r.idx * 8 + mi + 1;
      const pick = r1Picks[r.code][mi];
      picks[gid(r.name, 1, gameNum)] = T(r.code, pick);
    });
  });

  // R2: r2Strategy[regionCode] = array of 4, each being a seed number from the r1 winners
  // The R2 games pair consecutive R1 games: g1+g2->R2g1, g3+g4->R2g2, etc.
  REGIONS.forEach(r => {
    for (let i = 0; i < 4; i++) {
      const gameNum = r.idx * 4 + i + 1;
      const pick = r2Strategy[r.code][i];
      picks[gid(r.name, 2, gameNum)] = T(r.code, pick);
    }
  });

  // Sweet 16: s16Strategy[regionCode] = [2 seeds] (pairs R2 games: g1+g2->S16g1, g3+g4->S16g2)
  REGIONS.forEach(r => {
    for (let i = 0; i < 2; i++) {
      const gameNum = r.idx * 2 + i + 1;
      const pick = s16Strategy[r.code][i];
      picks[gid(r.name, 3, gameNum)] = T(r.code, pick);
    }
  });

  // Elite 8: e8Strategy[regionCode] = seed of region winner
  REGIONS.forEach(r => {
    const gameNum = r.idx + 1;
    picks[gid(r.name, 4, gameNum)] = T(r.code, e8Strategy[r.code]);
  });

  // Final Four: ffStrategy = [winner of E vs W, winner of S vs M]
  // ff-r5-g1: East vs West
  picks['ff-r5-g1'] = T(ffStrategy[0][0], ffStrategy[0][1]);
  // ff-r5-g2: South vs Midwest
  picks['ff-r5-g2'] = T(ffStrategy[1][0], ffStrategy[1][1]);

  // Championship
  picks['championship-r6-g1'] = T(champStrategy[0], champStrategy[1]);

  return picks;
}

// Calculate score for R1+R2 (completed games only)
function calcScore(picks) {
  let score = 0, correct = 0;
  const POINTS = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 6: 32 };

  for (const [gameId, actualWinner] of Object.entries(ACTUAL)) {
    if (picks[gameId] === actualWinner) {
      const round = parseInt(gameId.split('-r')[1].split('-')[0]);
      score += POINTS[round] || 1;
      correct++;
    }
  }
  return { score, correct };
}

// ============================================================
// BRACKET 1: THE ORACLE (28/32 R1, 13/16 R2, champion: Duke)
// ============================================================
// Missed R1: g7 (Vanderbilt upset), g11 (UCSD upset), g15 (CSU upset), g29 (McNeese upset)
// Got Baylor upset right, got Oklahoma upset right
const oracle_r1 = {
  E: [1, 9, 5, 4, 6, 3, 7, 2],  // missed g7: picked StMary's(7) not Vanderbilt(10)
  W: [1, 9, 5, 4, 6, 3, 7, 2],  // missed g11: Memphis(5) not UCSD(12), missed g15: Kansas(7) not CSU(10)
  S: [1, 8, 5, 4, 6, 3, 7, 2],  // all correct
  M: [1, 8, 5, 4, 6, 3, 7, 2],  // missed g29: Illinois(6) not McNeese(11)
};
// R2: 13/16 correct. Missed: east-r2-g2 (picked Oregon not Arizona), south-r2-g10 (picked TAMU not Michigan), midwest-r2-g14 (picked Clemson not Purdue)
const oracle_r2 = {
  E: [1, 5, 3, 2],  // g2 wrong: Oregon(5) not Arizona(4)
  W: [1, 4, 3, 2],  // all correct (their Memphis feeds g6, they pick Maryland ✓)
  S: [1, 4, 3, 2],  // g10 wrong: TAMU(4) not Michigan(5)
  M: [1, 5, 3, 2],  // g14 wrong: Clemson(5) not Purdue(4)
};
const oracle_s16 = { E: [1, 2], W: [1, 2], S: [1, 2], M: [1, 2] };
const oracle_e8 = { E: 1, W: 1, S: 1, M: 1 };
const oracle_ff = [['E', 1], ['M', 1]]; // Duke, Houston
const oracle_champ = ['E', 1]; // Duke

const oraclePicks = buildBracket(oracle_r1, oracle_r2, oracle_s16, oracle_e8, oracle_ff, oracle_champ);
const oracleScore = calcScore(oraclePicks);

// ============================================================
// BRACKET 2: THE MIDDLE (22/32 R1, 9/16 R2, champion: Auburn)
// ============================================================
// Missed 10 R1: all 6 upsets + 4 others
const middle_r1 = {
  E: [1, 8, 5, 4, 6, 3, 7, 2],   // missed g2: MissState(8), g7: StMary's(7)
  W: [1, 8, 5, 4, 6, 3, 7, 2],   // missed g10: UConn(8), g11: Memphis(5), g15: Kansas(7)
  S: [1, 9, 5, 4, 6, 3, 7, 2],   // missed g18: BoiseState(9), S correct otherwise... wait need 10 total misses
  M: [1, 8, 5, 4, 6, 3, 10, 2],  // missed g29: Illinois(6)→picked right? No M[4]=6=Illinois. Actual is McNeese(11). missed g31: Arkansas(10)
};
// Let me recount misses:
// E: g2 (8 not 9), g7 (7 not 10) = 2
// W: g10 (8 not 9), g11 (5 not 12), g15 (7 not 10) = 3
// S: g18 (9 not 8) = 1
// M: g29 (6 not 11), g31 (10 not 7) = 2
// Total = 8... need 10. Let me add 2 more.
const middle_r1_fixed = {
  E: [1, 8, 5, 4, 6, 3, 7, 2],   // g2: 8✗, g7: 7✗ = 2 wrong
  W: [1, 8, 5, 4, 11, 3, 7, 2],  // g10: 8✗, g11: 5✗, g13: 11✗(Drake, actual Missouri 6), g15: 7✗ = 4 wrong
  S: [1, 9, 5, 4, 6, 3, 10, 2],  // g18: 9✗, g23: 10✗(NewMexico, actual Louisville 7) = 2 wrong
  M: [1, 8, 5, 4, 6, 3, 7, 2],   // g29: 6✗, (g31 correct KState=7) = wait... need more
};
// W: g10(8✗), g11(5✗), g13(11✗), g15(7✗) = 4
// S: g18(9✗), g23(10✗) = 2
// E: g2(8✗), g7(7✗) = 2
// M: g29(6✗), g31(10✗) = 2
// Total = 10 ✓
const middle_r1_v2 = {
  E: [1, 8, 5, 4, 6, 3, 7, 2],   // g2: 8✗, g7: 7✗
  W: [1, 8, 5, 4, 11, 3, 7, 2],  // g10: 8✗, g11: 5✗, g13: 11✗, g15: 7✗
  S: [1, 9, 5, 4, 6, 3, 10, 2],  // g18: 9✗, g23: 10✗
  M: [1, 8, 5, 4, 6, 3, 10, 2],  // g29: 6✗, g31: 10✗
};

// R2: 9/16 correct (7 wrong)
const middle_r2 = {
  E: [1, 4, 3, 2],  // g1: Duke(1)✓, g2: Arizona(4)✓, g3: Wisc(3)✓, g4: Alabama(2)✓ = all ✓
  W: [1, 4, 3, 2],  // g5: Florida(1)✓, g6: MD(4)✓, g7: TTU(3)✓, g8: StJ(2)✓ = all ✓
  // Wait that's 8 correct so far... need only 9 total with 7 wrong
  // Let me make some wrong:
  S: [1, 4, 6, 7],  // g9: Auburn(1)✓, g10: TAMU(4)✗, g11: OleMiss(6)✗, g12: Louisville(7)✗
  M: [1, 5, 6, 10], // g13: Houston(1)✓, g14: Clemson(5)✗, g15: Illinois(6)✗, g16: Arkansas(10)✗
};
// Wait: E(4✓) + W(4✓) + S(1✓,3✗) + M(1✓,3✗) = 10✓, 6✗. Need 9✓.
// Let me make one more wrong in West:
const middle_r2_v2 = {
  E: [1, 5, 3, 2],  // g1: Duke(1)✓, g2: Oregon(5)✗, g3: Wisc(3)✓, g4: Alabama(2)✓ = 3✓,1✗
  W: [1, 4, 3, 2],  // all ✓ = 4✓
  S: [1, 4, 6, 7],  // g9✓, g10✗, g11✗, g12✗ = 1✓,3✗
  M: [1, 5, 6, 10], // g13✓, g14✗, g15✗, g16✗ = 1✓,3✗
};
// 3+4+1+1 = 9✓, 1+0+3+3 = 7✗ ✓

// S16+: champion Auburn
const middle_s16 = { E: [1, 2], W: [1, 2], S: [1, 2], M: [1, 2] };
const middle_e8 = { E: 1, W: 1, S: 1, M: 1 };
const middle_ff = [['E', 1], ['S', 1]]; // Duke, Auburn
const middle_champ = ['S', 1]; // Auburn (still alive but not winner)

const middlePicks = buildBracket(middle_r1_v2, middle_r2_v2, middle_s16, middle_e8, middle_ff, middle_champ);
const middleScore = calcScore(middlePicks);

// ============================================================
// BRACKET 3: THE BUSTED (18/32 R1, 5/16 R2, champion: ELIMINATED)
// ============================================================
// Champion pick: Texas A&M (S4) - eliminated in R2 (lost to Michigan)
// 14 wrong in R1, 11 wrong in R2
const busted_r1 = {
  E: [1, 8, 12, 4, 11, 3, 7, 2],    // g2:8✗, g3:12✗(Liberty), g5:11✗(VCU), g7:7✗ = 4 wrong
  W: [1, 8, 5, 13, 11, 14, 7, 2],   // g10:8✗, g12:13✗(Yale), g13:11✗(Drake), g14:14✗(Lipscomb), g15:7✗ = 5 wrong
  S: [1, 9, 12, 4, 11, 3, 10, 2],   // g18:9✗, g19:12✗(GCU), g21:11✗(NorthIowa), g23:10✗(NewMexico) = 4 wrong
  M: [1, 9, 5, 4, 6, 3, 7, 2],      // g26:9✗, g29:6✗ = wait... M[1]=9=Troy. Actual is Gonzaga(8). ✗
                                      // g29:6✗ = 1 wrong total... need more
};
// E: 4, W: 5, S: 4, M: need 1 more for 14 total
// Let me fix M:
const busted_r1_v2 = {
  E: [1, 8, 12, 4, 11, 3, 7, 2],    // g2✗,g3✗,g5✗,g7✗ = 4 wrong
  W: [1, 8, 5, 4, 11, 3, 7, 2],     // g10✗,g11✗,g13✗,g15✗ = 4 wrong
  S: [1, 9, 12, 4, 11, 3, 10, 2],   // g18✗,g19✗,g21✗,g23✗ = 4 wrong
  M: [1, 9, 5, 4, 6, 3, 7, 2],      // g26✗,g29✗ = 2 wrong
};
// Total: 4+5+4+1 = 14 wrong, 18 correct ✓

// R2: 5/16 correct (11 wrong)
const busted_r2 = {
  E: [1, 12, 11, 7],  // g1:Duke(1)✓, g2:Liberty(12)✗, g3:VCU(11)✗, g4:StMary's(7)✗ = 1✓,3✗
  W: [1, 5, 11, 7],   // g5:Fla(1)✓, g6:Memphis(5)✗, g7:Drake(11)✗, g8:Kansas(7)✗ = 1✓,3✗
  S: [1, 4, 11, 2],   // g9:Aub(1)✓, g10:TAMU(4)✗, g11:NorthIowa(11)✗, g12:MichSt(2)✓ = 2✓,2✗
  M: [1, 5, 6, 2],    // g13:Hou(1)✓, g14:Clem(5)✗, g15:Ill(6)✗, g16:Tenn(2)✓ = actually wait...
};
// 1+1+2+? = need 5 total correct
// M: g13:Hou✓, g14:Clemson(5)✗(actual Purdue), g15:Ill(6)✗(actual Kentucky), g16:Tenn(2)✓ = 2
// Total: 1+1+2+2 = 6... need 5. Let me adjust:
const busted_r2_v2 = {
  E: [1, 12, 11, 7],  // g1✓, g2✗, g3✗, g4✗ = 1✓
  W: [1, 5, 11, 7],   // g5✓, g6✗, g7✗, g8✗ = 1✓
  S: [1, 4, 11, 10],  // g9✓, g10✗, g11✗, g12✗ = 1✓ (g12: NewMexico(10)✗)
  M: [1, 5, 6, 7],    // g13✓, g14✗, g15✗, g16:KState(7)✗ = 1✓
};
// Total: 1+1+1+1 = 4... need 5. Add one more correct:
const busted_r2_v3 = {
  E: [1, 12, 11, 7],  // 1✓
  W: [1, 5, 14, 7],   // g5✓, g7: Lipscomb(14)✗, 1✓ only
  S: [1, 4, 3, 10],   // g9✓, g10✗, g11:ISU(3)✓, g12✗ = 2✓
  M: [1, 5, 6, 7],    // g13✓, rest ✗ = 1✓
};
// 1+1+2+1 = 5 ✓

// Later rounds: champion Texas A&M (eliminated in R2 - lost to Michigan)
const busted_s16 = { E: [1, 7], W: [1, 7], S: [1, 4], M: [1, 6] };
const busted_e8 = { E: 1, W: 1, S: 4, M: 1 };
const busted_ff = [['E', 1], ['S', 4]]; // Duke, Texas A&M
const busted_champ = ['S', 4]; // Texas A&M — ELIMINATED

const bustedPicks = buildBracket(busted_r1_v2, busted_r2_v3, busted_s16, busted_e8, busted_ff, busted_champ);
const bustedScore = calcScore(bustedPicks);

// ============================================================
// BRACKET 4: CHALK EATER (32/32 R1 perfect!, 8/16 R2)
// ============================================================
// All chalk in R1 = always pick the higher seed (lower number)
// This means they got all 26 chalk correct + all 6 upsets wrong... wait that's 26 correct not 32
// The upsets are: g2(9>8), g7(10>7), g10(9>8), g11(12>5), g15(10>7), g29(11>6) = 6 upsets
// 32 - 6 = 26 non-upsets = 26 chalk correct
// But the task says 32/32 perfect R1! So they got every R1 game right including upsets.
// "All chalk picks (top seeds)" — this description is about their later rounds.
// Let me re-read: "R1: 32/32 (perfect!), R2: 8/16 (regression), All chalk picks (top seeds)"
// So they went perfect in R1 (meaning they called all upsets too), but their R2 picks were chalky and that's where they fell apart.
// Actually wait - if they're "chalk" picks, they would pick higher seeds. A true chalk picker gets 26/32 not 32/32.
// I think the intent is: they're MOSTLY chalk but happened to get R1 perfect (lucky guesses?).
// Let me interpret as: they got 32/32 R1 (they correctly predicted everything including upsets - they really knew R1).
// R2: they defaulted to chalk (higher seeds) and that's where things went wrong.

const chalk_r1 = {
  E: [1, 9, 5, 4, 6, 3, 10, 2],  // all actual winners (perfect!)
  W: [1, 9, 12, 4, 6, 3, 10, 2], // all actual winners
  S: [1, 8, 5, 4, 6, 3, 7, 2],   // all actual winners
  M: [1, 8, 5, 4, 11, 3, 7, 2],  // all actual winners
};

// R2: 8/16. They pick chalk (higher seeded team in each matchup) which causes misses
// R2 matchups based on actual R1 winners:
// E: Duke(1)vBaylor(9)→1✓, Oregon(5)vArizona(4)→pick4✓, BYU(6)vWisc(3)→pick3✓, Vandy(10)vBama(2)→pick2✓ = 4 correct
// W: Fla(1)vOkla(9)→1✓, UCSD(12)vMD(4)→4✓, Mizzou(6)vTTU(3)→3✓, CSU(10)vSJU(2)→2✓ = 4 correct
// S: Aub(1)vCreighton(8)→1✓, Mich(5)vTAMU(4)→pick4✗, OleMiss(6)vISU(3)→3✓, Lou(7)vMSU(2)→2✓ = 3 correct
// M: Hou(1)vGonz(8)→1✓, Clem(5)vPurdue(4)→4✓, McN(11)vUK(3)→3✓, KSU(7)vTenn(2)→2✓ = 4 correct
// That's 4+4+3+4 = 15 correct. Need 8. Let me make them more chalky/wrong:

// Actually, "chalk" means they always pick the higher seed. Let me re-think what their R1 picks would be:
// True chalk R1: always pick higher seed (lower seed number)
// g2: 8-MissState over 9-Baylor → chalk pick = 8 ✗ (actual: 9-Baylor)
// g7: 7-StMary's over 10-Vandy → chalk = 7 ✗ (actual: 10-Vandy)
// etc.
// Chalk gets 26/32, not 32/32.

// OK let me reinterpret the task. "R1: 32/32 (perfect!)" means actually perfect.
// "All chalk picks (top seeds)" refers to their R2+ strategy being chalk.
// But if they got R1 perfect, their R2 matchups are correct (they fed the right teams).
// Then in R2, picking chalk (higher seed) they get:
// E: Duke(1)vBaylor(9)→Duke(1)✓, Oregon(5)vAriz(4)→Ariz(4)✓, BYU(6)vWisc(3)→Wisc(3)✓, Vandy(10)vBama(2)→Bama(2)✓ = 4✓
// W: Fla(1)vOkla(9)→Fla(1)✓, UCSD(12)vMD(4)→MD(4)✓, Mizzou(6)vTTU(3)→TTU(3)✓, CSU(10)vSJU(2)→SJU(2)✓ = 4✓
// S: Aub(1)vCreighton(8)→Aub(1)✓, Mich(5)vTAMU(4)→TAMU(4)✗(actual Mich), OleMiss(6)vISU(3)→ISU(3)✓, Lou(7)vMSU(2)→MSU(2)✓ = 3✓
// M: Hou(1)vGonz(8)→Hou(1)✓, Clem(5)vPurdue(4)→Purdue(4)✓, McN(11)vUK(3)→UK(3)✓, KSU(7)vTenn(2)→Tenn(2)✓ = 4✓
// Total: 15✓. That's too many. Need 8.

// Hmm. Chalk R2 with correct R1 feeders mostly gets right answers. The task says 8/16.
// Let me make it so they had R1 perfect but their R2 picks were more like "gut feelings" that went wrong.
// Or: they went perfect R1 but had different R2 expectations.
// With 8/16 = half right in R2. Let me just pick 8 wrong ones:

const chalk_r2 = {
  E: [1, 5, 6, 10], // g1:Duke✓, g2:Oregon(5)✗, g3:BYU(6)✗, g4:Vandy(10)✗ = 1✓
  W: [1, 9, 6, 10], // g5:Fla✓, g6:UCSD(12)→pick Okla(9)...
  // hmm need consistency. R1 winners feed R2. Their R1 is perfect. So R2 feeders are actual R1 winners.
  // But their R2 PICKS need to be one of the two teams in the matchup.
  // E-R2g1: Duke(1) vs Baylor(9) → they pick Duke(1) ✓
  // E-R2g2: Oregon(5) vs Arizona(4) → they pick Oregon(5) ✗
  // E-R2g3: BYU(6) vs Wisconsin(3) → pick BYU(6) ✗
  // E-R2g4: Vanderbilt(10) vs Alabama(2) → pick Vanderbilt(10) ✗
  // That's very un-chalk for R2 though... picking lower seeds.
  // Let me just accept 8/16 and pick sensible wrongs:
  S: [1, 4, 6, 7],  // partially wrong
  M: [1, 5, 11, 7], // partially wrong
};
// I need to carefully build this. Let me try:
// Chalk R2 = always pick higher seed in matchup:
// E: Duke(1)✓, Arizona(4)✓, Wisconsin(3)✓, Alabama(2)✓ = 4✓
// W: Florida(1)✓, Maryland(4)✓, TexasTech(3)✓, StJohns(2)✓ = 4✓
// S: Auburn(1)✓, TAMU(4)✗, IowaState(3)✓, MichState(2)✓ = 3✓
// M: Houston(1)✓, Purdue(4)✓, Kentucky(3)✓, Tennessee(2)✓ = 4✓
// = 15. Basically chalk R2 with actual R1 feeders = 15/16.
// The only non-chalk R2 result is Michigan(5) over TAMU(4).
// I need 8 more wrong. The only way is they DIDN'T pick all chalk in R1 feeders.
// OK I think the simplest interpretation: R1 perfect 32/32, but R2 picks 8/16 because they made bad calls.
// Their R2 picks just happen to be wrong for 8 games. Let me pick which 8:

const chalk_r2_v2 = {
  E: [1, 5, 6, 2],    // g1:Duke✓, g2:Oregon✗, g3:BYU✗, g4:Alabama✓ = 2✓
  W: [1, 12, 6, 10],  // g5:Fla✓, g6:UCSD✗, g7:Missouri✗, g8:CSU✗ = 1✓
  S: [1, 8, 6, 7],    // g9:Auburn✓, g10:Creighton✗, g11:OleMiss✗, g12:Louisville✗ = 1✓
  M: [1, 8, 11, 2],   // g13:Houston✓, g14:Gonzaga✗, g15:McNeese✗, g16:Tennessee✓ = hmm
};
// Wait: M: g14 picks Gonzaga(8) - actual R2 matchup is Clemson vs Purdue. Gonzaga isn't in this game.
// The person had Gonzaga winning R1g26 (which is correct), but R2g14 is the winner of g27+g28 = Clemson vs Purdue.
// Oh wait - R2g14 feeds from R1g27 and R1g28, not from R1g25+g26.
// Let me reclarify R2 feeder structure:
// R2 game index i (0-3) per region feeds from R1 game indices 2i and 2i+1.
// So R2g1 ← R1g1+R1g2, R2g2 ← R1g3+R1g4, R2g3 ← R1g5+R1g6, R2g4 ← R1g7+R1g8
// For Midwest: R2g13 ← R1g25+R1g26, R2g14 ← R1g27+R1g28, R2g15 ← R1g29+R1g30, R2g16 ← R1g31+R1g32
// Their R1 is perfect, so:
// R2g13: Houston(1) vs Gonzaga(8) → must pick one of these
// R2g14: Clemson(5) vs Purdue(4) → must pick one of these
// R2g15: McNeese(11) vs Kentucky(3) → must pick one of these
// R2g16: KState(7) vs Tennessee(2) → must pick one of these

// OK so for Chalk Eater's R2, they must pick from the actual R2 matchup participants (since R1 was perfect).
// Let me build correctly:

// R2 matchups (from perfect R1):
// E: [Duke vs Baylor, Oregon vs Arizona, BYU vs Wisconsin, Vanderbilt vs Alabama]
// W: [Florida vs Oklahoma, UCSD vs Maryland, Missouri vs TTU, CSU vs StJohns]
// S: [Auburn vs Creighton, Michigan vs TAMU, OleMiss vs ISU, Louisville vs MSU]
// M: [Houston vs Gonzaga, Clemson vs Purdue, McNeese vs Kentucky, KState vs Tennessee]

// Their wrong R2 picks (8 wrong, pick the loser):
const chalk_r2_final = {
  E: [1, 5, 6, 10],    // Duke✓, Oregon✗, BYU✗, Vanderbilt✗ = 1✓,3✗
  W: [1, 12, 6, 10],   // Florida✓, UCSD✗, Missouri✗, CSU✗ = 1✓,3✗
  S: [1, 8, 3, 2],     // Auburn✓, Creighton✗, ISU✓, MSU✓ = 3✓,1✗
  M: [1, 4, 3, 2],     // Houston✓, Purdue✓, Kentucky✓, Tennessee✓ = 4✓,0✗
};
// 1+1+3+4 = 9... need 8. Adjust:
const chalk_r2_final2 = {
  E: [1, 5, 6, 10],    // 1✓,3✗
  W: [1, 12, 6, 10],   // 1✓,3✗
  S: [1, 8, 3, 2],     // 1✓(g9) + Creighton✗ + ISU✓ + MSU✓ = 3✓,1✗... hmm wait
};
// Actually let me recount: g9 Auburn✓, g10 Creighton(8) - actual is Michigan(5), so ✗.
// g11 ISU(3) - actual is ISU(3) ✓. g12 MSU(2) - actual is MSU(2) ✓.
// S = 3✓, 1✗. That's fine. Total 1+1+3+4 = 9✓ and 3+3+1+0 = 7✗.
// Need exactly 8✓. Let me make one more wrong in M:
const chalk_r2_final3 = {
  E: [1, 5, 6, 10],     // Duke✓, Oregon✗, BYU✗, Vanderbilt✗ = 1✓
  W: [1, 12, 6, 10],    // Florida✓, UCSD✗, Missouri✗, CSU✗ = 1✓
  S: [1, 8, 3, 2],      // Auburn✓, Creighton✗, ISU✓, MSU✓ = 3✓
  M: [1, 5, 3, 2],      // Houston✓, Clemson✗, Kentucky✓, Tennessee✓ = 3✓
};
// 1+1+3+3 = 8✓ ✓

// S16+: all chalk (top seeds advance)
const chalk_s16 = { E: [1, 10], W: [1, 10], S: [1, 8], M: [1, 5] };
// Wait, s16 feeds from R2 picks. Their R2 picks:
// E-S16g1 ← E-R2g1(Duke) + E-R2g2(Oregon) → pick Duke(1)
// E-S16g2 ← E-R2g3(BYU) + E-R2g4(Vanderbilt) → pick BYU(6)? or Vanderbilt(10)?
// They're "chalk" so pick lower seed number: BYU(6)
// But wait, in their bracket, E-R2g3 winner = BYU, E-R2g4 winner = Vanderbilt
// Chalk = pick higher seed = BYU(6 < 10)
const chalk_s16_v2 = {
  E: [1, 6],    // Duke, BYU (higher seeds from their R2 picks)
  W: [1, 6],    // Florida, Missouri
  S: [1, 3],    // Auburn, Iowa State
  M: [1, 3],    // Houston, Kentucky
};
const chalk_e8 = { E: 1, W: 1, S: 1, M: 1 };
const chalk_ff = [['E', 1], ['M', 1]]; // Duke, Houston
const chalk_champ = ['E', 1]; // Duke

const chalkPicks = buildBracket(chalk_r1, chalk_r2_final3, chalk_s16_v2, chalk_e8, chalk_ff, chalk_champ);
const chalkScore = calcScore(chalkPicks);

// ============================================================
// BRACKET 5: CINDERELLA HUNTER (20/32 R1, 11/16 R2)
// ============================================================
// Picked multiple upsets — some hit, some missed
// Contrarian champion pick
// 12 wrong in R1: they picked lots of upsets, some were right, some wrong
// They correctly called: Baylor(9), Vanderbilt(10), Oklahoma(9), UCSD(12), CSU(10), McNeese(11) = all 6 upsets!
// But also picked 12 other upsets that DIDN'T happen = 12 wrong
const cinderella_r1 = {
  E: [16, 9, 12, 13, 11, 3, 10, 15],  // g1:16✗, g2:9✓, g3:12✗, g4:13✗, g5:11✗, g6:3✓, g7:10✓, g8:15✗ = 3✓,5✗
  W: [1, 9, 12, 13, 11, 14, 10, 2],   // g9:1✓, g10:9✓, g11:12✓, g12:13✗, g13:11✗, g14:14✗, g15:10✓, g16:2✓ = 5✓,3✗
  S: [16, 9, 12, 13, 11, 3, 10, 2],   // g17:16✗, g18:9✗, g19:12✗, g20:13✗, g21:11✗, g22:3✓, g23:10✗, g24:2✓ = 2✓,6✗
  M: [1, 9, 12, 13, 11, 14, 10, 15],  // g25:1✓, g26:9✗, g27:12✗, g28:13✗, g29:11✓, g30:14✗, g31:10✗, g32:15✗ = 2✓,6✗
};
// 3+5+2+2 = 12✓ ... need 20✓. That's only 12 correct. Too many upsets picked!
// Let me dial it back. They pick some upsets but not all underdogs.
const cinderella_r1_v2 = {
  E: [1, 9, 5, 4, 11, 3, 10, 2],     // g5:VCU(11)✗ = 1 wrong, rest correct including upsets g2,g7
  W: [1, 9, 12, 4, 11, 3, 10, 2],    // g13:Drake(11)✗ = 1 wrong, got all 3 West upsets right!
  S: [1, 9, 12, 4, 11, 14, 10, 15],  // g18:9✗, g19:12✗, g21:11✗, g22:14✗, g23:10✗, g24:15✗ = 6 wrong
  M: [1, 9, 12, 13, 11, 14, 10, 2],  // g26:9✗, g27:12✗, g28:13✗, g29:11✓, g30:14✗, g31:10✗ = 5 wrong, 1 right
};
// E: 7✓,1✗; W: 7✓,1✗; S: 2✓,6✗; M: 3✓,5✗ = 19✓,13✗. Need 20✓.
// Adjust M: change one wrong to right
const cinderella_r1_v3 = {
  E: [1, 9, 5, 4, 11, 3, 10, 2],     // 7✓, 1✗ (g5:VCU)
  W: [1, 9, 12, 4, 11, 3, 10, 2],    // 7✓, 1✗ (g13:Drake)
  S: [1, 9, 12, 4, 11, 14, 10, 15],  // 2✓, 6✗
  M: [1, 8, 12, 13, 11, 14, 7, 2],   // g25:1✓, g26:8✓, g27:12✗, g28:13✗, g29:11✓, g30:14✗, g31:7✓, g32:2✓ = 5✓,3✗
};
// 7+7+2+5 = 21✓. Need 20. Make one more wrong:
const cinderella_r1_v4 = {
  E: [1, 9, 5, 4, 11, 3, 10, 2],     // 7✓, 1✗
  W: [1, 9, 12, 4, 11, 3, 10, 2],    // 7✓, 1✗
  S: [1, 9, 12, 4, 11, 14, 10, 15],  // 2✓, 6✗
  M: [1, 9, 12, 13, 11, 14, 7, 2],   // g25:1✓, g26:9✗, g27:12✗, g28:13✗, g29:11✓, g30:14✗, g31:7✓, g32:2✓ = 4✓,4✗
};
// 7+7+2+4 = 20✓ ✓

// R2: 11/16 correct
const cinderella_r2 = {
  E: [1, 4, 3, 2],    // all ✓ = 4✓ (Duke, Arizona, Wisconsin, Alabama)
  W: [1, 12, 3, 10],  // g5:Fla✓, g6:UCSD✗(actual MD), g7:TTU✓... wait their g7 pick is TTU?
  // Their R1 W picks: g9:1(Fla), g10:9(Okla), g11:12(UCSD), g12:4(MD), g13:11(Drake), g14:3(TTU), g15:10(CSU), g16:2(SJU)
  // R2g5: Fla vs Okla → pick Fla(1) ✓
  // R2g6: UCSD(12) vs MD(4) → pick UCSD(12) or MD(4)?
  //   Cinderella hunter picks UCSD(12)! Actual winner is MD. ✗
  // R2g7: Drake(11) vs TTU(3) → pick Drake(11)? Actual is TTU. But they picked Drake in g13.
  //   Cinderella picks Drake(11)! Actual is TTU(3). ✗
  // R2g8: CSU(10) vs SJU(2) → pick CSU(10)? Actual is SJU.
  //   Cinderella picks CSU(10)! ✗
  // W: 1✓, 3✗
  // Hmm that's a lot wrong. Total so far: 4+1 = 5✓ of 8. Need 11 total of 16.
  // Let me adjust W:
  S: [1, 4, 3, 2],    // Actually their S R1 was messy. R1 S picks: 1,9,12,4,11,14,10,15
  // R2g9: Auburn(1) vs BoiseState(9) → Auburn(1) ✓
  // R2g10: GCU(12) vs TAMU(4) → pick GCU(12)? Cinderella! Actual is Michigan(5). ✗ (and GCU wasn't even the actual R1 winner)
  // Wait, Michigan(5) beat GCU(12) in actual R1. But cinderella PICKED GCU(12) for R1g19. So their R2g10 is GCU vs TAMU → pick GCU. Actual winner is Michigan. ✗
  // R2g11: NorthIowa(11) vs HighPoint(14) → picked these in R1. Actual winners are OleMiss(6) and ISU(3).
  // The cinderella's R2g11 matchup is NorthIowa(11) vs HighPoint(14). Pick NorthIowa. Actual R2 winner is ISU(3). ✗
  // R2g12: NewMexico(10) vs Wofford(15) → cinderella's matchup. Pick... NewMexico(10). Actual is MSU(2). ✗
  // S: 1✓, 3✗
  M: [1, 9, 11, 2],   // Their M R1: 1,9,12,13,11,14,7,2
  // R2g13: Houston(1) vs Troy(9) → pick Houston(1) ✓. Actually actual is Houston vs Gonzaga. But cinderella picked Troy(9) for R1g26.
  // So their R2g13: Houston(1) vs Troy(9) → pick Houston ✓ (actual is Houston)
  // R2g14: UCF(12) vs Winthrop(13) → both wrong R1 picks. Pick UCF(12). Actual winner is Purdue(4). ✗
  // R2g15: McNeese(11) vs Morehead(14) → cinderella's R1 picks. Pick McNeese(11). Actual is Kentucky(3). ✗
  // R2g16: KState(7) vs Tennessee(2) → both correct R1. Pick Tennessee(2) ✓
  // M: 2✓, 2✗
};
// E:4 + W:1 + S:1 + M:2 = 8✓... need 11.

// This isn't working well with the cinderella having so many wrong R1 feeds.
// Let me reconsider. In East and other regions where cinderella got most R1 right, their R2 picks can be mostly right.
// Key: their total is 20/32 R1 and 11/16 R2. They need 11 R2 correct.
// With 20 correct R1, they have the right feeders for most R2 games in their strong regions.

// Let me rebuild more carefully:
// E (7/8 R1 correct, only g5 wrong): R2 feeders are mostly correct
// R2g1: Duke vs Baylor → Duke ✓
// R2g2: Oregon vs Arizona → pick Oregon(5) ✗
// R2g3: VCU(11, wrong) vs Wisconsin → pick Wisconsin ✓ (VCU is wrong but doesn't matter for scoring; actual is Wisconsin)
// Wait - scoring just checks picks[gameId] === results[gameId]. Results for east-r2-g3 is Wisconsin (E03).
// If cinderella picked Wisconsin(3) for east-r2-g3, that matches! Even though their feeder was VCU not BYU.
// R2g4: Vanderbilt vs Alabama → pick Alabama ✓ (or Vanderbilt for upset? They're cinderella...)
// Actually cinderella might pick the upset... pick Vanderbilt(10) ✗

// Let me be more strategic. 11/16 correct in R2:
const cinderella_r2_v2 = {
  E: [1, 4, 3, 10],    // Duke✓, Arizona✓, Wisconsin✓, Vanderbilt✗ = 3✓
  W: [1, 12, 3, 10],   // Florida✓, UCSD✗, TTU✓, CSU✗ = 2✓
  S: [1, 5, 3, 2],     // Auburn✓, Michigan✓, ISU✓, MSU✓ = 4✓ (they know S well even with bad R1)
  M: [1, 4, 11, 2],    // Houston✓, Purdue✓... wait, cinderella picked UCF(12) for R1g27 and Winthrop(13) for R1g28
                        // Their R2g14 matchup is UCF vs Winthrop. They'd pick UCF(12).
                        // But actual result is Purdue(4). So pick = UCF(12). ✗!
                        // Same issue: their R2 pick team ID won't match actual winner ID.
};
// Hmm this is the key issue. When scoring, if cinderella's pick for R2g14 is UCF(12) = M12 but actual winner is Purdue(4) = M04, it's wrong regardless.
// For them to get R2 right, they need to have picked the actual winner's team ID for that game.
// If they picked wrong R1 feeders but still type in the correct team for R2... that's not consistent bracket-wise.
// But the scoring only checks the team ID.

// Actually I think for a real bracket app, the R2 pick is constrained to be one of the user's R1 picks that feed into it.
// So if cinderella picked UCF and Winthrop for R1g27/g28, their R2g14 MUST be UCF or Winthrop.
// They can't pick Purdue for R2g14 because Purdue wasn't in their bracket path.

// This means: for games where they got R1 wrong, cascading into R2, they CANNOT get R2 right
// UNLESS the actual R2 winner happens to be the same team they incorrectly advanced.

// Let me recalculate how many R2 games the cinderella CAN get right:
// E (7/8 R1): wrong g5 = VCU instead of BYU.
//   R2g3 feeds from g5(VCU) and g6(Wisconsin). Actual winner is Wisconsin.
//   Cinderella has VCU vs Wisconsin. Can pick Wisconsin ✓.
//   Other 3 R2 games have correct feeders. Max E R2 = 4.
// W (7/8 R1): wrong g13 = Drake instead of Missouri.
//   R2g7 feeds from g13(Drake) and g14(TTU). Actual winner is TTU.
//   Cinderella has Drake vs TTU. Can pick TTU ✓.
//   Other 3 R2 games have correct feeders. Max W R2 = 4.
// S (2/8 R1): wrong g18,g19,g21,g22,g23,g24. Only g17(Auburn✓) and g20(TAMU✓).
//   R2g9 feeds from g17(Auburn✓) and g18(BoiseState✗). Actual is Auburn vs Creighton → winner Auburn.
//   Cinderella has Auburn vs BoiseState → pick Auburn ✓ (Auburn is actual winner).
//   R2g10 feeds from g19(GCU✗) and g20(TAMU✓). Actual winner is Michigan.
//   Cinderella has GCU vs TAMU. Neither is Michigan. CANNOT get right. ✗
//   R2g11 feeds from g21(NorthIowa✗) and g22(HighPoint✗). Actual winner is Iowa State.
//   Cinderella has NorthIowa vs HighPoint. Neither is ISU. CANNOT get right. ✗
//   R2g12 feeds from g23(NewMexico✗) and g24(Wofford✗). Actual winner is MSU.
//   Cinderella has NewMexico vs Wofford. Neither is MSU. CANNOT get right. ✗
//   S max R2 = 1.
// M (4/8 R1): wrong g26,g27,g28,g30.
//   R2g13 feeds from g25(Houston✓) and g26(Troy✗). Actual winner is Houston.
//   Cinderella has Houston vs Troy → pick Houston ✓.
//   R2g14 feeds from g27(UCF✗) and g28(Winthrop✗). Actual winner is Purdue.
//   CANNOT get right. ✗
//   R2g15 feeds from g29(McNeese✓) and g30(Morehead✗). Actual winner is Kentucky.
//   Cinderella has McNeese vs Morehead. Neither is Kentucky. CANNOT get right. ✗
//   R2g16 feeds from g31(KState✓) and g32(Tennessee✓). Actual winner is Tennessee.
//   Can pick Tennessee ✓.
//   M max R2 = 2.
// Total max R2 = 4+4+1+2 = 11. Exactly 11! Perfect!

// So cinderella picks all correct where possible:
const cinderella_r2_final = {
  E: [1, 4, 3, 2],    // all ✓ = 4
  W: [1, 4, 3, 2],    // all ✓ = 4
  S: [1, 4, 14, 10],  // Auburn✓, TAMU(only option besides GCU)✗, HighPoint✗, NewMexico✗ = 1
                       // Wait: R2g10 their matchup is GCU vs TAMU. They can pick either. Actual winner = Michigan(5). ✗
                       // R2g11: NorthIowa vs HighPoint → pick either. Actual = ISU. ✗
                       // R2g12: NewMexico vs Wofford → pick either. Actual = MSU. ✗
  M: [1, 12, 11, 2],  // Houston✓, UCF✗, McNeese✗, Tennessee✓ = 2
};
// Total = 4+4+1+2 = 11 ✓ !!!

// S16+ for cinderella: contrarian champion pick. Let's say St. John's (W2) - unlikely but alive.
const cinderella_s16 = {
  E: [1, 2],    // Duke, Alabama
  W: [1, 2],    // Florida, St. John's
  S: [1, 4],    // Auburn, TAMU (from their bracket)
  M: [1, 2],    // Houston, Tennessee
};
const cinderella_e8 = { E: 2, W: 2, S: 4, M: 2 }; // picks the underdogs in Elite 8!
const cinderella_ff = [['E', 2], ['M', 2]]; // Alabama, Tennessee
const cinderella_champ = ['M', 2]; // Tennessee — contrarian, still alive

const cinderellaPicks = buildBracket(cinderella_r1_v4, cinderella_r2_final, cinderella_s16, cinderella_e8, cinderella_ff, cinderella_champ);
const cinderellaScore = calcScore(cinderellaPicks);

// ============================================================
// BRACKET 6: LATE SURGER (24/32 R1, 14/16 R2)
// ============================================================
// R1: 24/32 (8 wrong), R2: 14/16 (on fire!)
// Picking up ground fast, has path to win
const surger_r1 = {
  E: [1, 8, 5, 4, 6, 3, 7, 2],       // g2:8✗, g7:7✗ = 2 wrong
  W: [1, 8, 5, 4, 6, 3, 7, 2],       // g10:8✗, g11:5✗, g15:7✗ = 3 wrong
  S: [1, 8, 5, 4, 6, 3, 7, 2],       // g18:8✓! (Creighton is seed 8 ✓), all correct!
  // Wait, S actual: g17:1✓, g18:8✓, g19:5✓, g20:4✓, g21:6✓, g22:3✓, g23:7✓, g24:2✓ = 8/8
  M: [1, 8, 5, 4, 6, 3, 7, 2],       // g29:6✗(Illinois, actual McNeese 11), g31:7✓(KState)
  // wait M actual g26: Gonzaga(8)✓, g29: McNeese(11) so picked Illinois(6)✗
};
// E: 6✓,2✗; W: 5✓,3✗; S: 8✓,0✗; M: 7✓,1✗ = 26✓. Need 24. Need 2 more wrong.
// Add wrongs to S:
const surger_r1_v2 = {
  E: [1, 8, 5, 4, 6, 3, 7, 2],       // g2:8✗, g7:7✗ = 2✗
  W: [1, 8, 5, 4, 6, 3, 7, 2],       // g10:8✗, g11:5✗, g15:7✗ = 3✗
  S: [1, 9, 5, 4, 6, 3, 10, 2],      // g18:9✗(Boise), g23:10✗(NewMexico) = 2✗
  M: [1, 8, 5, 4, 6, 3, 7, 2],       // g29:6✗ = 1✗
};
// 2+3+2+1 = 8✗, 24✓ ✓

// R2: 14/16 (2 wrong). Which 2 wrong?
// With their R1 picks, let me check which R2 games they can get right:
// E: wrong g2(8 not 9), g7(7 not 10).
//   R2g1: Duke vs MissState(their pick). Actual winner Duke. Pick Duke ✓.
//   R2g2: Oregon vs Arizona. Both correct. Pick either.
//   R2g3: BYU vs Wisconsin. Both correct. Pick either.
//   R2g4: StMary's(their pick, wrong) vs Alabama. Actual winner Alabama. Pick Alabama ✓.
// W: wrong g10(8 not 9), g11(5 not 12), g15(7 not 10).
//   R2g5: Florida vs UConn(their pick). Actual winner Florida. Pick Florida ✓.
//   R2g6: Memphis(their pick, wrong) vs Maryland. Actual winner Maryland. Pick Maryland ✓.
//   R2g7: Missouri vs TTU. Both correct. Pick either.
//   R2g8: Kansas(their pick, wrong) vs StJohns. Actual winner StJohns. Pick StJohns ✓.
// S: wrong g18(9 not 8), g23(10 not 7).
//   R2g9: Auburn vs BoiseState(their pick). Actual winner Auburn. Pick Auburn ✓.
//   R2g10: Michigan vs TAMU. Both correct.
//   R2g11: OleMiss vs ISU. Both correct.
//   R2g12: NewMexico(their pick, wrong) vs MSU. Actual winner MSU. Pick MSU ✓.
// M: wrong g29(6 not 11).
//   R2g13: Houston vs Gonzaga. Both correct.
//   R2g14: Clemson vs Purdue. Both correct.
//   R2g15: Illinois(their pick, wrong) vs Kentucky. Actual winner Kentucky. Pick Kentucky ✓.
//   R2g16: KState vs Tennessee. Both correct.

// In every R2 game, the surger CAN pick the correct winner (actual winner is always available as an option).
// Max R2 = 16. Need 14 (2 wrong). Let me pick 2 to be wrong:
// wrong: east-r2-g2 (pick Oregon not Arizona), south-r2-g10 (pick TAMU not Michigan)
const surger_r2 = {
  E: [1, 5, 3, 2],     // Duke✓, Oregon✗, Wisconsin✓, Alabama✓ = 3✓
  W: [1, 4, 3, 2],     // Florida✓, Maryland✓, TTU✓, StJohns✓ = 4✓
  S: [1, 4, 3, 2],     // Auburn✓, TAMU✗, ISU✓, MSU✓ = 3✓
  M: [1, 4, 3, 2],     // Houston✓, Purdue✓, Kentucky✓, Tennessee✓ = 4✓
};
// 3+4+3+4 = 14✓ ✓

// S16+: has path to win. Champion: Duke (same as actual winner!)
const surger_s16 = { E: [1, 2], W: [1, 2], S: [1, 2], M: [1, 2] };
const surger_e8 = { E: 1, W: 1, S: 1, M: 1 };
const surger_ff = [['E', 1], ['M', 1]]; // Duke, Houston
const surger_champ = ['E', 1]; // Duke

const surgerPicks = buildBracket(surger_r1_v2, surger_r2, surger_s16, surger_e8, surger_ff, surger_champ);
const surgerScore = calcScore(surgerPicks);

// ============================================================
// OUTPUT
// ============================================================
const brackets = [
  { name: 'The Oracle', userId: '11111111-1111-1111-1111-111111111111', displayName: 'The Oracle', email: 'oracle@test.ufsl.net', picks: oraclePicks, ...oracleScore },
  { name: 'Just Here for the Pizza', userId: '22222222-2222-2222-2222-222222222222', displayName: 'Pizza Fan', email: 'pizza@test.ufsl.net', picks: middlePicks, ...middleScore },
  { name: 'RIP My Bracket', userId: '33333333-3333-3333-3333-333333333333', displayName: 'RIP Bracket', email: 'rip@test.ufsl.net', picks: bustedPicks, ...bustedScore },
  { name: 'Chalk Eater', userId: '44444444-4444-4444-4444-444444444444', displayName: 'Chalk Eater', email: 'chalk@test.ufsl.net', picks: chalkPicks, ...chalkScore },
  { name: 'I Believe in Miracles', userId: '55555555-5555-5555-5555-555555555555', displayName: 'Miracle Man', email: 'miracles@test.ufsl.net', picks: cinderellaPicks, ...cinderellaScore },
  { name: 'Slow Start, Fast Finish', userId: '66666666-6666-6666-6666-666666666666', displayName: 'Late Surger', email: 'surger@test.ufsl.net', picks: surgerPicks, ...surgerScore },
];

// Count R1 and R2 correct separately
function countByRound(picks) {
  let r1 = 0, r2 = 0;
  for (const [gameId, actualWinner] of Object.entries(ACTUAL)) {
    const round = parseInt(gameId.split('-r')[1].split('-')[0]);
    if (picks[gameId] === actualWinner) {
      if (round === 1) r1++;
      if (round === 2) r2++;
    }
  }
  return { r1, r2 };
}

console.log('=== BRACKET SUMMARY ===');
brackets.forEach(b => {
  const counts = countByRound(b.picks);
  console.log(`${b.name}: score=${b.score}, correct=${b.correct}, R1=${counts.r1}/32, R2=${counts.r2}/16, picks_count=${Object.keys(b.picks).length}`);
});

// Verify champion picks
console.log('\n=== CHAMPION PICKS ===');
brackets.forEach(b => {
  const champ = b.picks['championship-r6-g1'];
  console.log(`${b.name}: ${champ}`);
});

// Output JSON for each bracket
console.log('\n=== PICKS JSON ===');
brackets.forEach(b => {
  console.log(`--- ${b.name} ---`);
  console.log(JSON.stringify(b.picks));
});

// Output SQL
console.log('\n=== SQL ===');

// Shawn's profile (commissioner)
const shawnId = '73016ba6-ac6b-451e-9562-f6d0be8914ae';

// Pool
const poolId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
console.log(`
-- Create test profiles (upsert to avoid conflicts)
INSERT INTO profiles (id, display_name, email) VALUES
  ('${shawnId}', 'Shawn', 'shawn@ufsl.net')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;
`);

brackets.forEach(b => {
  console.log(`INSERT INTO profiles (id, display_name, email) VALUES
  ('${b.userId}', '${b.displayName}', '${b.email}')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;`);
});

console.log(`
-- Create test pool
INSERT INTO pools (id, name, commissioner_id, invite_code, status, is_public)
VALUES ('${poolId}', 'Test Pool 2025', '${shawnId}', 'TESTPOOL', 'active', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, invite_code = EXCLUDED.invite_code;

-- Pool members
INSERT INTO pool_members (id, pool_id, user_id, role) VALUES
  (gen_random_uuid(), '${poolId}', '${shawnId}', 'commissioner')
ON CONFLICT (pool_id, user_id) DO NOTHING;
`);

brackets.forEach(b => {
  console.log(`INSERT INTO pool_members (id, pool_id, user_id, role) VALUES
  (gen_random_uuid(), '${poolId}', '${b.userId}', 'member')
ON CONFLICT (pool_id, user_id) DO NOTHING;`);
});

console.log('');

// Brackets
brackets.forEach(b => {
  const picksJson = JSON.stringify(b.picks).replace(/'/g, "''");
  console.log(`INSERT INTO brackets (id, pool_id, user_id, name, is_submitted, score, correct_picks, max_possible_score, picks, bracket_type)
VALUES (gen_random_uuid(), '${poolId}', '${b.userId}', '${b.name.replace(/'/g, "''")}', true, ${b.score}, ${b.correct}, 192, '${picksJson}'::jsonb, 'full')
ON CONFLICT (pool_id, user_id) DO UPDATE SET name = EXCLUDED.name, score = EXCLUDED.score, correct_picks = EXCLUDED.correct_picks, picks = EXCLUDED.picks;`);
  console.log('');
});
