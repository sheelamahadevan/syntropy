'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { HabitLog } from '@/types/database';

export interface HabitToggleParams {
  habitId: string;
  userId: string;
  logDate: string;
  completed: boolean;
  actualValue?: number;
}

export function useHabitToggle() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      habitId,
      userId,
      logDate,
      completed,
      actualValue = completed ? 1 : 0,
    }: HabitToggleParams) => {
      const { data, error } = await supabase
        .from('habit_logs')
        .upsert(
          {
            habit_id: habitId,
            user_id: userId,
            log_date: logDate,
            completed,
            actual_value: actualValue,
          },
          {
            onConflict: 'habit_id,log_date',
          }
        )
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },

    // Optimistic Update: Runs before the network request
    onMutate: async ({ habitId, logDate, completed, actualValue = completed ? 1 : 0 }) => {
      const queryKey = ['habit_logs', logDate];

      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous state for rollback
      const previousLogs = queryClient.getQueryData<HabitLog[]>(queryKey);

      // Optimistically update the cache immediately
      queryClient.setQueryData<HabitLog[]>(queryKey, (old = []) => {
        const existingIndex = old.findIndex(
          (log) => log.habit_id === habitId && log.log_date === logDate
        );

        if (existingIndex >= 0) {
          const updated = [...old];
          updated[existingIndex] = {
            ...updated[existingIndex],
            completed,
            actual_value: actualValue,
          };
          return updated;
        }

        // New log entry placeholder
        return [
          ...old,
          {
            id: `temp-${Date.now()}`,
            habit_id: habitId,
            user_id: '',
            log_date: logDate,
            completed,
            actual_value: actualValue,
            created_at: new Date().toISOString(),
          },
        ];
      });

      return { previousLogs, queryKey };
    },

    // Rollback if mutation fails
    onError: (_err, _variables, context) => {
      if (context?.queryKey && context?.previousLogs !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previousLogs);
      }
    },

    // Always refetch in background after error or success to keep server and client in sync
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });
}
