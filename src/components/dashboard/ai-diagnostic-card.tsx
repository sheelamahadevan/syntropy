'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, AlertTriangle, ArrowRight, BrainCircuit, CheckCircle2 } from 'lucide-react';

interface SuggestedTweak {
  habitTitle: string;
  action: string;
  rationale: string;
}

interface DiagnosticAnalysis {
  overallConsistencyScore: number;
  primaryBottleneck: string;
  bottleneckDescription: string;
  suggestedTweaks: SuggestedTweak[];
  cached?: boolean;
  snapshot_date?: string;
}

interface AiDiagnosticCardProps {
  isAuthenticated: boolean;
}

export function AiDiagnosticCard({ isAuthenticated }: AiDiagnosticCardProps) {
  const [analysis, setAnalysis] = useState<DiagnosticAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = async (forceRefresh = false) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || `Request failed with status ${res.status}`);
      }

      const data: DiagnosticAnalysis = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch AI diagnostic');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Load cached insight on mount without forcing refresh
      fetchInsight(false);
    }
  }, [isAuthenticated]);

  return (
    <Card className="border border-border/80 bg-gradient-to-br from-card via-card to-violet-500/5 shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500 border border-violet-500/20">
            <BrainCircuit className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              Gemini Behavioral Diagnostics
              {analysis?.cached && (
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                  Cached Today (0 Tokens)
                </span>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              30-day pattern correlation and cognitive friction detection
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchInsight(true)}
          disabled={loading || !isAuthenticated}
          className="h-8 gap-1.5 text-xs border-violet-500/30 hover:bg-violet-500/10 text-violet-600 dark:text-violet-300"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Run Diagnostics'}
        </Button>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {!isAuthenticated ? (
          <div className="py-6 text-center space-y-2">
            <Sparkles className="size-8 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">
              Personalized AI Diagnostics Locked
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Sign in with your account to allow Gemini to analyze your past 30 days of habit data and output micro-action adjustments.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Diagnostic Error</p>
              <p>{error}</p>
            </div>
          </div>
        ) : loading && !analysis ? (
          <div className="py-8 text-center space-y-3">
            <RefreshCw className="size-6 mx-auto animate-spin text-violet-500" />
            <p className="text-xs text-muted-foreground">
              Gemini is identifying behavioral bottlenecks and cognitive friction...
            </p>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {/* Primary Bottleneck Banner */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Primary Behavioral Bottleneck: {analysis.primaryBottleneck}
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed pl-6">
                {analysis.bottleneckDescription}
              </p>
            </div>

            {/* Suggested Micro-Tweaks */}
            {analysis.suggestedTweaks && analysis.suggestedTweaks.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Targeted Micro-Adjustments
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.suggestedTweaks.map((tweak, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span className="truncate">{tweak.habitTitle}</span>
                        <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                      </div>
                      <div className="flex items-start gap-1.5 text-foreground font-medium">
                        <ArrowRight className="size-3.5 text-violet-500 shrink-0 mt-0.5" />
                        <span>{tweak.action}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground italic border-t border-border/40 pt-1.5">
                        {tweak.rationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center space-y-2">
            <Sparkles className="size-7 mx-auto text-violet-500/60" />
            <p className="text-xs text-muted-foreground">
              Ready to run your 30-day behavioral check. Click &quot;Run Diagnostics&quot; to begin.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
