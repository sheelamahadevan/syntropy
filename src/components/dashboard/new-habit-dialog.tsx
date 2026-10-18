'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import { HabitCategory, FrictionLevel, TargetType, Habit } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface NewHabitDialogProps {
  user: User | null;
  onHabitCreated: (newHabit: Habit) => void;
}

export function NewHabitDialog({ user, onHabitCreated }: NewHabitDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Mind');
  const [frictionLevel, setFrictionLevel] = useState<FrictionLevel>('medium');
  const [targetType, setTargetType] = useState<TargetType>('boolean');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (user) {
        const { data, error: insertError } = await supabase
          .from('habits')
          .insert({
            user_id: user.id,
            title: title.trim(),
            category,
            friction_level: frictionLevel,
            target_type: targetType,
            target_value: targetValue,
            is_active: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (data) {
          onHabitCreated(data);
        }
      } else {
        // Guest/Demo Mode creation
        const demoHabit: Habit = {
          id: `demo-${Date.now()}`,
          user_id: 'guest',
          title: title.trim(),
          category,
          friction_level: frictionLevel,
          target_type: targetType,
          target_value: targetValue,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        onHabitCreated(demoHabit);
      }

      setTitle('');
      setCategory('Mind');
      setFrictionLevel('medium');
      setTargetType('boolean');
      setTargetValue(1);
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to create habit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs" />}>
        <Plus className="size-4" />
        New Habit
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-500" />
            Add New Habit
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure habit friction and category to balance your daily cognitive entropy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Habit Title</label>
            <Input
              required
              placeholder="e.g. 45-min Deep Focus Block"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="w-full h-9 rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="Body">Body (Physical)</option>
                <option value="Mind">Mind (Cognitive)</option>
                <option value="Craft">Craft (Skill/Work)</option>
                <option value="Social">Social (Relational)</option>
                <option value="Finance">Finance (Security)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Friction Level
              </label>
              <select
                value={frictionLevel}
                onChange={(e) => setFrictionLevel(e.target.value as FrictionLevel)}
                className="w-full h-9 rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="low">Low (10 pts - automatic)</option>
                <option value="medium">Medium (20 pts - moderate effort)</option>
                <option value="high">High (35 pts - intense resistance)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Target Type</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
                className="w-full h-9 rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="boolean">Yes / No (Completion)</option>
                <option value="numeric">Count (Reps / Pages)</option>
                <option value="duration">Duration (Minutes)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Target Value
              </label>
              <Input
                type="number"
                min={1}
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value) || 1)}
                className="h-9"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Create Habit'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
