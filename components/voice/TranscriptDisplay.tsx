import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TranscriptEntry } from '@/types/voice';
import { useLanguage } from '@/hooks/useLanguage';

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
  personaColor?: string;
}

export function TranscriptDisplay({ entries, personaColor = '#C9956A' }: TranscriptDisplayProps) {
  const scrollRef = useRef<ScrollView>(null);
  const { rtl } = useLanguage();

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [entries.length]);

  if (entries.length === 0) return null;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {entries.map((entry, index) => (
        <View
          key={index}
          style={[
            styles.bubble,
            entry.role === 'user' ? styles.userBubble : styles.assistantBubble,
            rtl && { alignSelf: entry.role === 'user' ? 'flex-start' : 'flex-end' },
          ]}
        >
          <Text
            style={[
              styles.text,
              entry.role === 'assistant' && { color: personaColor },
            ]}
          >
            {entry.text}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 240,
  },
  content: {
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffffff15',
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
  },
  text: {
    color: '#F5E6D0',
    fontSize: 14,
    lineHeight: 20,
  },
});
