import { useState, useCallback } from 'react';
import { DrawnCard, SpreadType } from '@/types/card';
import { getSpread } from '@/lib/spreads';
import { useSupabase } from './useSupabase';

export function useCardDraw() {
  const supabase = useSupabase();
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const drawCards = useCallback(async (spreadType: SpreadType) => {
    setLoading(true);
    setRevealedCount(0);
    try {
      const spread = getSpread(spreadType);
      const { data, error } = await supabase.functions.invoke('cards-draw', {
        body: { count: spread.cardCount },
      });
      if (error) throw error;
      setCards(data.cards);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const revealCard = useCallback((index: number) => {
    setRevealedCount((prev) => Math.max(prev, index + 1));
  }, []);

  const revealAll = useCallback(() => {
    setRevealedCount(cards.length);
  }, [cards.length]);

  const reset = useCallback(() => {
    setCards([]);
    setRevealedCount(0);
  }, []);

  return {
    cards,
    revealedCount,
    allRevealed: cards.length > 0 && revealedCount >= cards.length,
    loading,
    drawCards,
    revealCard,
    revealAll,
    reset,
  };
}
