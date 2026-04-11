import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLanguage } from '@/hooks/useLanguage';

interface ConsentModalProps {
  visible: boolean;
  type: 'voice' | 'data' | 'sensitive';
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ visible, type, onAccept, onDecline }: ConsentModalProps) {
  const { t } = useLanguage();

  const titles = {
    voice: t('consent.voice_title'),
    data: t('consent.data_title'),
    sensitive: t('consent.sensitive_title'),
  };

  const descriptions = {
    voice: t('consent.voice_desc'),
    data: t('consent.data_desc'),
    sensitive: t('consent.sensitive_desc'),
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{titles[type]}</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.description}>{descriptions[type]}</Text>
          </ScrollView>
          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.btn, styles.btnDecline]} onPress={onDecline}>
              <Text style={styles.btnDeclineText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={onAccept}>
              <Text style={styles.btnAcceptText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a0a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    borderWidth: 1,
    borderColor: '#C9956A33',
  },
  title: {
    color: '#F5E6D0',
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    maxHeight: 200,
  },
  description: {
    color: '#aaaaaa',
    fontSize: 14,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDecline: {
    backgroundColor: '#ffffff11',
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  btnDeclineText: {
    color: '#aaaaaa',
    fontWeight: '600',
  },
  btnAccept: {
    backgroundColor: '#C9956A',
  },
  btnAcceptText: {
    color: '#1a0a2e',
    fontWeight: '700',
  },
});
