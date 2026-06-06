import { supabase, hasSupabase } from './supabaseClient';

export interface MonthlyStatsItem {
  month: string;
  attempts: number;
  passed: number;
  failed: number;
  avgScore: number;
}

export interface AdminOverview {
  userCount: number;
  totalAttempts: number;
  totalPassed: number;
  totalScore: number;
  monthlyStats: MonthlyStatsItem[];
}

export interface SaveAttemptPayload {
  playerName: string;
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
      puzzle: payload.puzzle,
      passed: payload.passed,
      score: payload.score,
      created_at: payload.createdAt
    }
  ]);
  return null;
}

export async function fetchAdminOverview() {
  if (!hasSupabase || !supabase) {
    return {
      userCount: 0,
      totalAttempts: 0,
      totalPassed: 0,
      totalScore: 0,
      monthlyStats: [] as MonthlyStatsItem[]
    };
  }

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('attempts')
    .select('player_name,passed,score,created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) {
    return {
      userCount: 0,
      totalAttempts: 0,
      totalPassed: 0,
      totalScore: 0,
      monthlyStats: []
    };
  }

  const monthlyMap = new Map<
    string,
    { month: string; attempts: number; passed: number; failed: number; scoreTotal: number }
  >();
  const userSet = new Set<string>();
  let totalPassed = 0;
  let totalScore = 0;

  data.forEach((item) => {
    const monthKey = formatMonth(new Date(item.created_at));
    const existing = monthlyMap.get(monthKey) ?? {
      month: monthKey,
      attempts: 0,
      passed: 0,
      failed: 0,
      scoreTotal: 0
    };

    existing.attempts += 1;
    existing.passed += item.passed ? 1 : 0;
    existing.failed += item.passed ? 0 : 1;
    existing.scoreTotal += item.score;
    totalPassed += item.passed ? 1 : 0;
    totalScore += item.score;
    monthlyMap.set(monthKey, existing);

    userSet.add(item.player_name || 'Guest');
  });

  const monthlyStats = Array.from(monthlyMap.values()).map((item) => ({
    month: item.month,
    attempts: item.attempts,
    passed: item.passed,
    failed: item.failed,
    avgScore: item.attempts ? Number((item.scoreTotal / item.attempts).toFixed(1)) : 0
  }));
  const totalAttempts = data.length;

  return {
    userCount: userSet.size,
    totalAttempts,
    totalPassed,
    totalScore,
    monthlyStats
  };
}
