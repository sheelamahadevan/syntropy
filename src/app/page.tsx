'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Habit, HabitLog, FrictionLevel } from '@/types/database';
import {
  calculateDailyMasteryScore,
  calculateDecayedConsistencyScore,
  HabitLogEntry,
} from '@/lib/scoring';
import { MasterySummary } from '@/components/dashboard/mastery-summary';
import { HabitTracker } from '@/components/dashboard/habit-tracker';
import { AiDiagnosticCard } from '@/components/dashboard/ai-diagnostic-card';
import { NewHabitDialog } from '@/components/dashboard/new-habit-dialog';
import { AuthDialog } from '@/components/dashboard/auth-dialog';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Activity, Sparkles } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

// Starter habits for guest/demo preview
const INITIAL_DEMO_HABITS: Habit[] = [
  {
    id: 'demo-1',
    user_id: 'guest',
    title: '90-min Deep Coding & Architecture Block',
    category: 'Craft',
    friction_level: 'high',
    target_type: 'duration',
    target_value: 90,
    is_active: true,
    created_at: '2026-10-18T00:00:00.000Z',
  },
  {
    id: 'demo-2',
    user_id: 'guest',
    title: 'Morning 5km Run / Strength Training',
    category: 'Body',
    friction_level: 'high',
    target_type: 'duration',
    target_value: 45,
    is_active: true,
    created_at: '2026-10-18T00:00:00.000Z',
  },
  {
    id: 'demo-3',
    user_id: 'guest',
    title: 'Read 20 pages of Systems Thinking',
    category: 'Mind',
    friction_level: 'medium',
    target_type: 'numeric',
    target_value: 20,
    is_active: true,
    created_at: '2026-10-18T00:00:00.000Z',
  },
  {
    id: 'demo-4',
    user_id: 'guest',
    title: '15-min Mindfulness Meditation',
    category: 'Mind',
    friction_level: 'low',
    target_type: 'duration',
    target_value: 15,
    is_active: true,
    created_at: '2026-10-18T00:00:00.000Z',
  },
  {
    id: 'demo-5',
    user_id: 'guest',
    title: 'Review expenses & balance portfolio',
    category: 'Finance',
    friction_level: 'low',
    target_type: 'boolean',
    target_value: 1,
    is_active: true,
    created_at: '2026-10-18T00:00:00.000Z',
  },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_DEMO_HABITS);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [todayDate, setTodayDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Initialize dates on client mount to avoid prerender clock freeze
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayDate(today);
    setSelectedDate(today);
  }, []);

  const supabase = createClient();

  // Load user session
  const checkUser = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    }
  }, [supabase]);

  // Load habits and logs from Supabase
  const loadData = useCallback(
    async (currentUser: User | null) => {
      if (!currentUser) {
        setHabits(INITIAL_DEMO_HABITS);
        setLogs([
          {
            id: 'log-demo-1',
            habit_id: 'demo-1',
            user_id: 'guest',
            log_date: selectedDate,
            completed: true,
            actual_value: 90,
            created_at: new Date().toISOString(),
          },
          {
            id: 'log-demo-3',
            habit_id: 'demo-3',
            user_id: 'guest',
            log_date: selectedDate,
            completed: true,
            actual_value: 20,
            created_at: new Date().toISOString(),
          },
        ]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
          .toISOString()
          .split('T')[0];

        const [habitsRes, logsRes] = await Promise.all([
          supabase.from('habits').select('*').eq('is_active', true).order('created_at', { ascending: true }),
          supabase.from('habit_logs').select('*').gte('log_date', thirtyDaysAgo),
        ]);

        if (habitsRes.data) {
          setHabits(habitsRes.data);
        }
        if (logsRes.data) {
          setLogs(logsRes.data);
        }
      } catch (err) {
        console.error('Error fetching data from Supabase:', err);
      } finally {
        setLoading(false);
      }
    },
    [supabase, selectedDate]
  );

  useEffect(() => {
    checkUser().then((currentUser) => {
      loadData(currentUser);
    });
  }, [checkUser, loadData]);

  // Date Navigation Handlers
  const handleDateChange = (offset: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offset);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const isToday = useMemo(() => {
    if (!selectedDate || !todayDate) return true;
    return selectedDate === todayDate;
  }, [selectedDate, todayDate]);

  // Habit Creation Callback
  const handleHabitCreated = (newHabit: Habit) => {
    setHabits((prev) => [...prev, newHabit]);
  };

  // Demo Habit Toggle Callback
  const handleToggleDemoHabit = (habitId: string) => {
    setLogs((prev) => {
      const existing = prev.find(
        (l) => l.habit_id === habitId && l.log_date === selectedDate
      );
      if (existing) {
        return prev.map((l) =>
          l.habit_id === habitId && l.log_date === selectedDate
            ? { ...l, completed: !l.completed }
            : l
        );
      }
      return [
        ...prev,
        {
          id: `demo-log-${Date.now()}`,
          habit_id: habitId,
          user_id: 'guest',
          log_date: selectedDate,
          completed: true,
          actual_value: 1,
          created_at: '2026-10-18T00:00:00.000Z',
        },
      ];
    });
  };

  // Habit Deletion Callback
  const handleDeleteHabit = async (habitId: string) => {
    if (user) {
      await supabase.from('habits').delete().eq('id', habitId);
    }
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  // Calculate Scores via lib/scoring.ts
  const { masteryScore, pointsEarned, totalPoints, frictionCounts } = useMemo(() => {
    const todayLogs: HabitLogEntry[] = habits.map((habit) => {
      const log = logs.find(
        (l) => l.habit_id === habit.id && l.log_date === selectedDate
      );
      return {
        completed: log?.completed || false,
        friction_level: habit.friction_level,
        log_date: selectedDate,
      };
    });

    const weights: Record<FrictionLevel, number> = { low: 10, medium: 20, high: 35 };
    let earned = 0;
    let total = 0;

    const counts: Record<FrictionLevel, { completed: number; total: number }> = {
      low: { completed: 0, total: 0 },
      medium: { completed: 0, total: 0 },
      high: { completed: 0, total: 0 },
    };

    todayLogs.forEach((item) => {
      const w = weights[item.friction_level];
      total += w;
      counts[item.friction_level].total += 1;
      if (item.completed) {
        earned += w;
        counts[item.friction_level].completed += 1;
      }
    });

    const score = calculateDailyMasteryScore(todayLogs);

    return {
      masteryScore: score,
      pointsEarned: earned,
      totalPoints: total,
      frictionCounts: counts,
    };
  }, [habits, logs, selectedDate]);

  // Decayed Momentum Calculation across 14 days
  const decayedScore = useMemo(() => {
    if (!todayDate) return 0;
    const pastDays: string[] = [];
    const baseTime = new Date(todayDate + 'T00:00:00').getTime();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(baseTime - i * 86400000).toISOString().split('T')[0];
      pastDays.push(d);
    }

    const history = pastDays.map((date) => {
      const dayLogs: HabitLogEntry[] = habits.map((h) => {
        const log = logs.find((l) => l.habit_id === h.id && l.log_date === date);
        return {
          completed: log?.completed || false,
          friction_level: h.friction_level,
          log_date: date,
        };
      });
      return { log_date: date, logs: dayLogs };
    });

    return calculateDecayedConsistencyScore(history, 0.88);
  }, [habits, logs, todayDate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xs">
              <Activity className="size-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight font-heading">
                  SYNTROPY
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Entropy Reversal &amp; Habit Diagnostics
              </p>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateChange(-1)}
              className="size-7 p-0 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="flex items-center gap-1 px-2 text-xs font-medium">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span>
                {isToday
                  ? 'Today'
                  : new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDateChange(1)}
              disabled={isToday}
              className="size-7 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Actions & Auth */}
          <div className="flex items-center gap-2">
            <NewHabitDialog user={user} onHabitCreated={handleHabitCreated} />
            <AuthDialog
              user={user}
              onAuthChange={() => {
                checkUser().then((currentUser) => loadData(currentUser));
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Guest Banner if not authenticated */}
        {!user && (
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-500 shrink-0" />
              <span>
                <strong>Preview Mode:</strong> You are exploring Syntropy with interactive sample data. Click <strong>Sign In / Sync</strong> to connect your Supabase database and enable private persistence.
              </span>
            </div>
            <AuthDialog
              user={user}
              onAuthChange={() => {
                checkUser().then((currentUser) => loadData(currentUser));
              }}
            />
          </div>
        )}

        {/* 1. Mastery Score & Momentum Summary Cards */}
        <MasterySummary
          masteryScore={masteryScore}
          decayedScore={decayedScore}
          pointsEarned={pointsEarned}
          totalPoints={totalPoints}
          frictionCounts={frictionCounts}
        />

        {/* 2. Gemini AI Behavioral Diagnostic Card */}
        <AiDiagnosticCard isAuthenticated={!!user} />

        {/* 3. Daily Habit Tracker Checklist */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Daily Habit Checklist
              </h2>
              <p className="text-xs text-muted-foreground">
                Toggling habits updates your mastery score instantly.
              </p>
            </div>
            <NewHabitDialog user={user} onHabitCreated={handleHabitCreated} />
          </div>

          <HabitTracker
            habits={habits}
            logs={logs}
            selectedDate={selectedDate}
            user={user}
            onToggleDemoHabit={handleToggleDemoHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        <p>Syntropy — Powered by Next.js 16, Supabase RLS, and Google Gemini Diagnostics.</p>
      </footer>
    </div>
  );
}
