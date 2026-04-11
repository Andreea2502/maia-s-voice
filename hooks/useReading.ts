import { useState, useCallback } from 'react';
import { ReadingStep } from '@/types/reading';
import { SpreadType, RecognizedCard } from '@/types/card';
import { InputMode } from '@/types/voice';
import { useSupabase } from './useSupabase';

export function useReading() {
  const supabase = useSupabase();
  const [state, setState] = useState<ReadingStep>({ step: 'idle' });
  const [readingId, setReadingId] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goToPersonaIntro = useCallback(() => {
    setState({ step: 'persona_intro' });
  }, []);

  const goToChooseInputMode = useCallback(() => {
    setState({ step: 'choose_input_mode' });
  }, []);

  const startVoiceOnboarding = useCallback((sessionId: string) => {
    setState({ step: 'voice_onboarding', sessionId });
  }, []);

  const startTextOnboarding = useCallback(() => {
    setState({ step: 'text_onboarding' });
  }, []);

  const goToChooseMethod = useCallback(() => {
    setState({ step: 'choose_method' });
  }, []);

  const startReading = useCallback(async (params: {
    spreadType: SpreadType;
    question?: string;
    readingType: 'virtual' | 'photo_upload';
    inputMode: InputMode;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reading-start', { body: params });
      if (error) throw error;
      setReadingId(data.reading_id);
      if (params.readingType === 'virtual') {
        setState({ step: 'virtual_draw', spreadType: params.spreadType });
      } else {
        setState({ step: 'photo_upload' });
      }
    } catch (err) {
      setState({ step: 'error', message: err instanceof Error ? err.message : 'Failed to start reading' });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const startCardRecognition = useCallback((imageUri: string) => {
    setState({ step: 'card_recognition', imageUri });
  }, []);

  const confirmCards = useCallback((cards: RecognizedCard[]) => {
    setState({ step: 'card_confirmation', cards });
  }, []);

  const generateInterpretation = useCallback(async (params: {
    cards: any[];
    onboardingSummary?: string;
    question?: string;
    voiceUsed: boolean;
  }) => {
    if (!readingId) return;
    setState({ step: 'generating_interpretation', readingId });
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reading-interpret', {
        body: { reading_id: readingId, ...params },
      });
      if (error) throw error;
      setInterpretation(data.interpretation);
      setState({ step: 'interpretation', readingId, interpretation: data.interpretation });
    } catch (err) {
      setState({ step: 'error', message: err instanceof Error ? err.message : 'Interpretation failed' });
    } finally {
      setLoading(false);
    }
  }, [readingId, supabase]);

  const goToFeedback = useCallback(() => {
    if (readingId) setState({ step: 'feedback', readingId });
  }, [readingId]);

  const submitFeedback = useCallback(async (rating: number, feedback?: string) => {
    if (!readingId) return;
    await supabase.from('readings').update({ user_rating: rating, user_feedback: feedback }).eq('id', readingId);
    reset();
  }, [readingId, supabase]);

  const reset = useCallback(() => {
    setState({ step: 'idle' });
    setReadingId(null);
    setInterpretation(null);
  }, []);

  return {
    state,
    readingId,
    interpretation,
    loading,
    goToPersonaIntro,
    goToChooseInputMode,
    startVoiceOnboarding,
    startTextOnboarding,
    goToChooseMethod,
    startReading,
    startCardRecognition,
    confirmCards,
    generateInterpretation,
    goToFeedback,
    submitFeedback,
    reset,
  };
}
