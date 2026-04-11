import { useState, useCallback } from 'react';
import { DrawnCard, SpreadType, Orientation } from '@/types/card';
import { getSpread } from '@/lib/spreads';
import { drawRandomCards } from '@/lib/card-data';
import { supabase } from '@/lib/supabase';
import { isGuestMode } from '@/lib/guest';

export function useCardDraw() {
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const drawCards = useCallback(async (spreadType: SpreadType) => {
    setLoading(true);
    setRevealedCount(0);
    try {
      const spread = getSpread(spreadType);
      const guest = await isGuestMode();

      if (guest) {
        // Draw locally — no edge function needed
        const cardIds = drawRandomCards(spread.cardCount);
        const drawn: DrawnCard[] = cardIds.map((cardId, i) => ({
          position: i,
          cardId,
          orientation: (Math.random() > 0.3 ? 'upright' : 'reversed') as Orientation,
          recognizedFromPhoto: false,
        }));
        setCards(drawn);
      } else {
        const { data, error } = await supabase.functions.invoke('cards-draw', {
          body: { count: spread.cardCount },
        });
        if (error) throw error;
        setCards(data.cards);
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
