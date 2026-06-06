import { supabase, hasSupabase } from './supabaseClient';

export interface MonthlyStatsItem {
  month: string;
  attempts: number;
  passed: number;
  failed: number;
  avgScore: number;
}

export interface SessionSummaryItem {
  sessionId: string;
  playerName: string;
  attempts: number;
  passed: number;
  failed: number;
  score: number;
  passRate: number;
}

export interface UserSummaryItem {
  playerName: string;
  sessions: number;
  totalAttempts: number;
  totalScore: number;
  avgSessionScore: number;
}

export interface AdminOverview {
  userCount: number;
  totalSessions: number;
  totalAttempts: number;
  totalPassed: number;
  totalScore: number;
  monthlyStats: MonthlyStatsItem[];
  topSessions: SessionSummaryItem[];
  userSummary: UserSummaryItem[];
}

export interface SaveAttemptPayload {
  playerName: string;
  sessionId: string;
  puzzle: string;
  passed: boolean;
  score: number;
  createdAt: string;
}

const formatMonth = (date: Date) => {
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
};

export async function saveAttempt(payload: SaveAttemptPayload) {
  if (!hasSupabase || !supabase) {
    return null;
  }

  await supabase.from('attempts').insert([
    {
      player_name: payload.playerName || 'Guest',
      session_id: payload.sessionId,
      puzzle: payload.puzzle,
      passed: payload.passed,
      score: payload.score,
      created_at: payload.createdAt
    }
  ]);
  return null;
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  if (!hasSupabase || !supabase) {
    return {
      userCount: 0,
      totalSessions: 0,
      totalAttempts: 0,
      totalPassed: 0,
      totalScore: 0,
      monthlyStats: [] as MonthlyStatsItem[],
      topSessions: [],
      userSummary: []
    };
  }

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('attempts')
    .select('player_name,session_id,passed,score,created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) {
    return {
      userCount: 0,
      totalSessions: 0,
      totalAttempts: 0,
      totalPassed: 0,
      totalScore: 0,
      monthlyStats: [],
      topSessions: [],
      userSummary: []
    };
  }

  const monthlyMap = new Map<
    string,
    { month: string; attempts: number; passed: number; failed: number; scoreTotal: number }
  >();
  const userSet = new Set<string>();
  const sessionMap = new Map<
    string,
    { sessionId: string; playerName: string; attempts: number; passed: number; failed: number; score: number; firstActivity: string }
  >();
  const userSummaryMap = new Map<
    string,
    { playerName: string; sessions: Set<string>; totalAttempts: number; totalScore: number }
  >();
  let totalPassed = 0;
  let totalScore = 0;

  data.forEach((item) => {
    const monthKey = formatMonth(new Date(item.created_at));
    const existingMonth = monthlyMap.get(monthKey) ?? {
      month: monthKey,
      attempts: 0,
      passed: 0,
      failed: 0,
      scoreTotal: 0
    };

    existingMonth.attempts += 1;
    existingMonth.passed += item.passed ? 1 : 0;
    existingMonth.failed += item.passed ? 0 : 1;
    existingMonth.scoreTotal += item.score;
    monthlyMap.set(monthKey, existingMonth);

    const playerName = item.player_name || 'Guest';
    const sessionId = item.session_id || 'unknown';
    const existingSession = sessionMap.get(sessionId) ?? {
      sessionId,
      playerName,
      attempts: 0,
      passed: 0,
      failed: 0,
      score: 0,
      firstActivity: item.created_at
    };
    existingSession.attempts += 1;
    existingSession.passed += item.passed ? 1 : 0;
    existingSession.failed += item.passed ? 0 : 1;
    existingSession.score += item.score;
    sessionMap.set(sessionId, existingSession);

    const userSummary = userSummaryMap.get(playerName) ?? {
      playerName,
      sessions: new Set<string>(),
      totalAttempts: 0,
      totalScore: 0
    };
    userSummary.sessions.add(sessionId);
    userSummary.totalAttempts += 1;
    userSummary.totalScore += item.score;
    userSummaryMap.set(playerName, userSummary);

    userSet.add(playerName);
    totalPassed += item.passed ? 1 : 0;
    totalScore += item.score;
  });

  const monthlyStats = Array.from(monthlyMap.values()).map((item) => ({
    month: item.month,
    attempts: item.attempts,
    passed: item.passed,
    failed: item.failed,
    avgScore: item.attempts ? Number((item.scoreTotal / item.attempts).toFixed(1)) : 0
  }));
  const totalAttempts = data.length;
  const topSessions = Array.from(sessionMap.values())
    .map((item) => ({
      sessionId: item.sessionId,
      playerName: item.playerName,
      attempts: item.attempts,
      passed: item.passed,
      failed: item.failed,
      score: item.score,
      passRate: item.attempts ? Number(((item.passed / item.attempts) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const userSummary = Array.from(userSummaryMap.values()).map((item) => ({
    playerName: item.playerName,
    sessions: item.sessions.size,
    totalAttempts: item.totalAttempts,
    totalScore: item.totalScore,
    avgSessionScore: item.sessions.size ? Number((item.totalScore / item.sessions.size).toFixed(1)) : 0
  }));

  return {
    userCount: userSet.size,
    totalSessions: sessionMap.size,
    totalAttempts,
    totalPassed,
    totalScore,
    monthlyStats,
    topSessions,
    userSummary
  };
}
