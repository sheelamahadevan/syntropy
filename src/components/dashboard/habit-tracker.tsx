'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Dumbbell, Brain, Wrench, Users, DollarSign, Target } from 'lucide-react';
import { Habit, HabitCategory, HabitLog } from '@/types/database';
import { useHabitToggle } from '@/hooks/use-habit-toggle';
import type { User } from '@supabase/supabase-js';

interface HabitTrackerProps {
  habits: Habit[];
  logs: HabitLog[];
  selectedDate: string;
  user: User | null;
  onToggleDemoHabit?: (habitId: string) => void;
  onDeleteHabit?: (habitId: string) => void;
}

export function HabitTracker({
  habits,
  logs,
  selectedDate,
  user,
  onToggleDemoHabit,
  onDeleteHabit,
}: HabitTrackerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const toggleMutation = useHabitToggle();

  // Category Configuration
  const categoryConfig: Record<
    HabitCategory,
    { label: string; icon: any; color: string; badgeBg: string }
  > = {
    Body: {
      label: 'Body',
      icon: Dumbbell,
      color: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    },
    Mind: {
      label: 'Mind',
      icon: Brain,
      color: 'text-violet-500',
      badgeBg: 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400',
    },
    Craft: {
      label: 'Craft',
      icon: Wrench,
      color: 'text-amber-500',
      badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400',
    },
    Social: {
      label: 'Social',
      icon: Users,
      color: 'text-sky-500',
      badgeBg: 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400',
    },
    Finance: {
      label: 'Finance',
      icon: DollarSign,
      color: 'text-teal-500',
      badgeBg: 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400',
    },
  };

  const categories: Array<HabitCategory | 'All'> = [
    'All',
    'Body',
    'Mind',
    'Craft',
    'Social',
    'Finance',
  ];

  const filteredHabits = habits.filter(
    (h) => activeCategory === 'All' || h.category === activeCategory
  );

  const isCompleted = (habitId: string) => {
    const log = logs.find((l) => l.habit_id === habitId && l.log_date === selectedDate);
    return log?.completed || false;
  };

  const handleToggle = (habit: Habit) => {
    const currentCompleted = isCompleted(habit.id);
    const nextCompleted = !currentCompleted;

    if (user) {
      toggleMutation.mutate({
        habitId: habit.id,
        userId: user.id,
        logDate: selectedDate,
        completed: nextCompleted,
        actualValue: nextCompleted ? Number(habit.target_value) : 0,
      });
    } else if (onToggleDemoHabit) {
      onToggleDemoHabit(habit.id);
    }
  };

  const frictionBadge = (level: string) => {
    switch (level) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-500">
            High (35 pts)
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-500">
            Medium (20 pts)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            Low (10 pts)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const count =
            cat === 'All'
              ? habits.length
              : habits.filter((h) => h.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted border-border/50'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? 'bg-white/20 dark:bg-black/20 text-inherit'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Habit List */}
      <div className="space-y-2.5">
        {filteredHabits.length === 0 ? (
          <Card className="border-dashed border-border/80">
            <CardContent className="py-12 text-center space-y-2">
              <Target className="size-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                No active habits in this category
              </p>
              <p className="text-xs text-muted-foreground">
                Click &quot;New Habit&quot; above to add your daily habits.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredHabits.map((habit) => {
            const completed = isCompleted(habit.id);
            const cat = categoryConfig[habit.category];
            const CatIcon = cat?.icon || Target;

            return (
              <div
                key={habit.id}
                className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  completed
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-muted-foreground shadow-2xs'
                    : 'bg-card border-border/70 hover:border-border hover:shadow-xs'
                }`}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggle(habit)}
                    className={`size-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                      completed
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'border-input hover:border-emerald-500 bg-background'
                    }`}
                  >
                    {completed && <Check className="size-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 space-y-1">
                    <p
                      className={`text-sm font-medium leading-none truncate transition-all ${
                        completed
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {habit.title}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cat?.badgeBg}`}
                      >
                        <CatIcon className="size-2.5" />
                        {habit.category}
                      </span>

                      {frictionBadge(habit.friction_level)}

                      {habit.target_type !== 'boolean' && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Target: {habit.target_value}{' '}
                          {habit.target_type === 'duration' ? 'mins' : 'reps'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {onDeleteHabit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteHabit(habit.id)}
                      className="size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
