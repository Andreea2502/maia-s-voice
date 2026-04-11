import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageStyle } from 'react-native';
import { Persona } from '@/lib/personas';
import { useLanguage } from '@/hooks/useLanguage';

interface PersonaAvatarProps {
  persona: Persona;
  selected?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showInfo?: boolean;
}

const SIZE_MAP = { small: 60, medium: 90, large: 130 };

export function PersonaAvatar({
  persona,
  selected = false,
  onPress,
  size = 'medium',
  showInfo = false,
}: PersonaAvatarProps) {
  const { language } = useLanguage();
  const dim = SIZE_MAP[size];
  const name = persona.name[language] ?? persona.name['de'];
  const tagline = persona.tagline[language] ?? persona.tagline['de'];

  const avatarContent = (
    <View style={[styles.avatarRing, selected && { borderColor: persona.accentColor }]}>
      <View style={[styles.avatarBg, { backgroundColor: persona.backgroundGradient[1], width: dim, height: dim, borderRadius: dim / 2 }]}>
        <Text style={[styles.avatarEmoji, { fontSize: dim * 0.4 }]}>
          {persona.id === 'mystic_elena' ? '🌙' : persona.id === 'sage_amira' ? '⭐' : '🔮'}
        </Text>
      </View>
    </View>
  );

  if (!showInfo) {
    return onPress ? (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {avatarContent}
      </TouchableOpacity>
    ) : avatarContent;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.card, selected && { borderColor: persona.accentColor }]}>
      <View style={[styles.cardBg, { backgroundColor: persona.backgroundGradient[1] + '33' }]}>
        {avatarContent}
        <Text style={[styles.name, { color: persona.accentColor }]}>{name}</Text>
        <Text style={styles.tagline}>{tagline}</Text>
        {selected && (
          <View style={[styles.selectedBadge, { backgroundColor: persona.accentColor }]}>
            <Text style={styles.selectedText}>✓</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatarRing: {
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#ffffff22',
    padding: 3,
  },
  avatarBg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {},
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffffff22',
    overflow: 'hidden',
    width: 130,
  },
  cardBg: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 12,
    color: '#aaaaaa',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
