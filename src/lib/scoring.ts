// src/lib/scoring.ts

import { FrictionLevel } from '@/types/database';

export interface HabitLogEntry {
  completed: boolean;
  friction_level: FrictionLevel;
  log_date: string;
}

export interface DayScore {
  date: string;
  score: number;
}

/**
 * Computes a weighted daily mastery score (0-100) based on habit friction.
 * Higher friction habits (high: 35) yield greater impact than lower ones (low: 10).
 */
export function calculateDailyMasteryScore(todayLogs: HabitLogEntry[]): number {
  if (!todayLogs.length) return 0;

  const weights: Record<FrictionLevel, number> = { low: 10, medium: 20, high: 35 };
  let earnedPoints = 0;
  let totalPossible = 0;

  todayLogs.forEach((log) => {
    const weight = weights[log.friction_level] || 15;
    totalPossible += weight;
    if (log.completed) earnedPoints += weight;
  });

  return totalPossible > 0 ? Math.round((earnedPoints / totalPossible) * 100) : 0;
}

/**
 * Computes a decayed consistency score across a sequence of days.
 * Recent days carry higher weight with exponential decay (default decay factor: 0.88).
 * This models habit momentum and counteracts the loss of consistency over time.
 */
export function calculateDecayedConsistencyScore(
  history: { log_date: string; logs: HabitLogEntry[] }[],
  decayFactor: number = 0.88
): number {
  if (!history.length) return 0;

  // Sort chronologically ascending (oldest to newest)
  const sorted = [...history].sort(
    (a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
  );

  let weightedScoreSum = 0;
  let weightSum = 0;

  const totalDays = sorted.length;
  sorted.forEach((day, index) => {
    // Days ago relative to the most recent entry (0 = today/most recent)
    const daysAgo = totalDays - 1 - index;
    const weight = Math.pow(decayFactor, daysAgo);
    const dayScore = calculateDailyMasteryScore(day.logs);

    weightedScoreSum += dayScore * weight;
    weightSum += weight;
  });

  return weightSum > 0 ? Math.round(weightedScoreSum / weightSum) : 0;
}
