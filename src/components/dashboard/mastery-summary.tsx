'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Zap, Flame, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { FrictionLevel } from '@/types/database';

interface MasterySummaryProps {
  masteryScore: number;
  decayedScore: number;
  pointsEarned: number;
  totalPoints: number;
  frictionCounts: Record<FrictionLevel, { completed: number; total: number }>;
}

export function MasterySummary({
  masteryScore,
  decayedScore,
  pointsEarned,
  totalPoints,
  frictionCounts,
}: MasterySummaryProps) {
  // Syntropy State Evaluation
  const getStatus = (score: number) => {
    if (score >= 80) {
      return {
        label: 'Optimal Syntropy',
        subtext: 'High cognitive order, entropy effectively reversed',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        icon: Sparkles,
      };
    }
    if (score >= 50) {
      return {
        label: 'Steady Momentum',
        subtext: 'Equilibrium maintained, minor friction drag',
        color: 'text-sky-500',
        bg: 'bg-sky-500/10 border-sky-500/20',
        icon: TrendingUp,
      };
    }
    return {
      label: 'Entropy Accumulating',
      subtext: 'Behavioral resistance detected, consider low-friction habits',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10 border-amber-500/20',
      icon: ShieldAlert,
    };
  };

  const status = getStatus(masteryScore);
  const StatusIcon = status.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Daily Mastery Score */}
      <Card className="relative overflow-hidden border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 shadow-xs">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Daily Mastery Score
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
              <StatusIcon className="size-3" />
              {status.label}
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-3">
            <span className="text-5xl font-black tracking-tight text-foreground font-mono">
              {masteryScore}%
            </span>
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground font-mono">{pointsEarned}</span> / {totalPoints} pts earned
            </div>
          </div>

          <div className="space-y-1.5">
            <Progress value={masteryScore} className="h-2 bg-muted/60" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {status.subtext}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Decayed Consistency Momentum */}
      <Card className="border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 shadow-xs">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Decayed Consistency
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-violet-500/10 border-violet-500/20 text-violet-500">
              <Flame className="size-3" />
              Momentum
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-3">
            <span className="text-5xl font-black tracking-tight text-foreground font-mono">
              {decayedScore}%
            </span>
            <span className="text-xs text-muted-foreground">
              Weighted exponentially (decay = 0.88)
            </span>
          </div>

          <div className="space-y-1.5">
            <Progress value={decayedScore} className="h-2 bg-muted/60" />
            <p className="text-[11px] text-muted-foreground">
              Recent habits count higher to counteract cognitive entropy over time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Friction Distribution */}
      <Card className="border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 shadow-xs">
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Friction Allocation
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="size-3 text-amber-500" />
              Resistance Points
            </span>
          </div>

          <div className="my-2 space-y-2.5">
            {/* High Friction */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="size-2 rounded-full bg-rose-500" />
                High (35 pts)
              </span>
              <span className="font-mono text-muted-foreground">
                <strong className="text-foreground">{frictionCounts.high.completed}</strong> / {frictionCounts.high.total}
              </span>
            </div>

            {/* Medium Friction */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="size-2 rounded-full bg-amber-500" />
                Medium (20 pts)
              </span>
              <span className="font-mono text-muted-foreground">
                <strong className="text-foreground">{frictionCounts.medium.completed}</strong> / {frictionCounts.medium.total}
              </span>
            </div>

            {/* Low Friction */}
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="size-2 rounded-full bg-emerald-500" />
                Low (10 pts)
              </span>
              <span className="font-mono text-muted-foreground">
                <strong className="text-foreground">{frictionCounts.low.completed}</strong> / {frictionCounts.low.total}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Complete high-friction habits early in the day when willpower is maximal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
