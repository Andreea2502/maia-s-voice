import { useState, useCallback } from 'react';
import { SessionMemory } from '@/types/reading';
import { useSupabase } from './useSupabase';

export function useMemory() {
  const supabase = useSupabase();
  const [memories, setMemories] = useState<SessionMemory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMemories = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('session_memory')
        .select('*')
        .eq('user_id', userId)
        .order('importance_score', { ascending: false })
        .limit(20);
      setMemories(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return { memories, loading, fetchMemories };
}
