import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Switch, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { speak, stopSpeaking } from '@/lib/tts';
import { C } from '@/lib/colors';

const CONSENT_ITEMS = [
  {
    id: 'voice', icon: '🎙️', required: true,
    titles: {
      de: 'Sprachaufnahme', en: 'Voice Recording', ar: 'تسجيل الصوت',
      tr: 'Ses Kaydı', ro: 'Înregistrare vocală', hu: 'Hangfelvétel',
      hi: 'आवाज़ रिकॉर्डिंग', fa: 'ضبط صدا', rom: 'Glaso-înregistrimos',
    },
    descs: {
      de: 'Die App nimmt deine Stimme auf, damit Maia dir antworten kann. Die Aufnahme wird nur für deine Sitzung verwendet und danach gelöscht.',
      en: 'The app records your voice so Maia can respond to you. Recordings are used only for your session and deleted afterwards.',
      ar: 'يسجّل التطبيق صوتك حتى تستطيع مايا الرد عليك. تُستخدم التسجيلات فقط لجلستك وتُحذف بعدها.',
      tr: 'Uygulama, Maia\'nın sana yanıt verebilmesi için sesini kaydeder. Kayıtlar yalnızca oturumun için kullanılır ve ardından silinir.',
      ro: 'Aplicația îți înregistrează vocea pentru ca Maia să îți poată răspunde. Înregistrările sunt folosite doar pentru sesiunea ta și șterse ulterior.',
      hu: 'Az alkalmazás rögzíti a hangodat, hogy Maia válaszolhasson. A felvételeket csak a munkamenetedhez használják és utána töröljük.',
      hi: 'ऐप आपकी आवाज़ रिकॉर्ड करता है ताकि माया जवाब दे सके। रिकॉर्डिंग केवल आपके सत्र के लिए है और बाद में हटा दी जाती है।',
      fa: 'اپلیکیشن صدای شما را ضبط می‌کند تا مایا پاسخ دهد. ضبط‌ها فقط برای جلسه شما هستند و بعد حذف می‌شوند.',
      rom: 'I aplikacia thol pes tiro glaso te šaj Maia del tuke responsa. O înregistrimos si korkoro tiri sesiya thaj paľe del pes.',
    },
  },
  {
    id: 'data', icon: '💾', required: false,
    titles: {
      de: 'Gesprächsgedächtnis', en: 'Conversation Memory', ar: 'ذاكرة المحادثة',
      tr: 'Konuşma Hafızası', ro: 'Memoria conversației', hu: 'Beszélgetés memória',
      hi: 'बातचीत की याददाश्त', fa: 'حافظه مکالمه', rom: 'Vorba-memorimos',
    },
    descs: {
      de: 'Maia kann sich an frühere Gespräche erinnern und dir persönlichere Antworten geben. Du kannst das jederzeit in den Einstellungen ausschalten.',
      en: 'Maia can remember previous conversations to give you more personal responses. You can turn this off anytime in settings.',
      ar: 'تستطيع مايا أن تتذكر المحادثات السابقة لردود أكثر شخصية. يمكنك إيقاف هذا في أي وقت.',
      tr: 'Maia, önceki konuşmaları hatırlayarak daha kişisel yanıtlar verebilir. Bunu istediğin zaman kapatabilirsin.',
      ro: 'Maia poate să-și amintească conversațiile anterioare. Poți dezactiva oricând în setări.',
      hu: 'Maia emlékezhet a korábbi beszélgetésekre személyesebb válaszokhoz. Ezt bármikor kikapcsolhatod.',
      hi: 'माया पिछली बातचीत याद रख सकती है। आप इसे सेटिंग्स में कभी भी बंद कर सकते हैं।',
      fa: 'مایا می‌تواند مکالمات قبلی را به یاد بیاورد. می‌توانید این را در تنظیمات خاموش کنید.',
      rom: 'Maia šaj soven pes pal anglune vorba. Tu šaj mukh les korkori andi settings.',
    },
  },
  {
    id: 'sensitive', icon: '🌙', required: false,
    titles: {
      de: 'Persönliche Themen', en: 'Personal Topics', ar: 'مواضيع شخصية',
      tr: 'Kişisel Konular', ro: 'Subiecte personale', hu: 'Személyes témák',
      hi: 'व्यक्तिगत विषय', fa: 'موضوعات شخصی', rom: 'Personalune temata',
    },
    descs: {
      de: 'Tarot-Gespräche können persönliche Themen berühren. Diese Daten verlassen dein Gerät nie ohne deine ausdrückliche Erlaubnis.',
      en: 'Tarot conversations may touch on personal topics. This data never leaves your device without your explicit permission.',
      ar: 'قد تتطرق محادثات التاروت إلى مواضيع شخصية. لن تغادر هذه البيانات جهازك أبدًا بدون إذنك.',
      tr: 'Tarot konuşmaları kişisel konulara değinebilir. Bu veriler izniniz olmadan asla cihazınızı terk etmez.',
      ro: 'Conversațiile Tarot pot atinge subiecte personale. Datele nu părăsesc niciodată dispozitivul fără permisiunea ta.',
      hu: 'A tarot-beszélgetések személyes témákat érinthetnek. Az adatok soha nem hagyják el az eszközödet a beleegyezésed nélkül.',
      hi: 'टैरो बातचीत व्यक्तिगत विषयों को छू सकती है। यह डेटा आपकी अनुमति के बिना कभी आपके डिवाइस को नहीं छोड़ता।',
      fa: 'مکالمات تاروت ممکن است موضوعات شخصی داشته باشند. این داده‌ها بدون اجازه شما هرگز دستگاه را ترک نمی‌کنند.',
      rom: 'Tarot-vorba šaj len pes personalune temata. Kava data na džan katar tiro aparato bi tiri voja.',
    },
  },
  {
    id: 'terms', icon: '📋', required: true,
    titles: {
      de: 'Nutzungsbedingungen & Datenschutz', en: 'Terms & Privacy Policy', ar: 'الشروط والخصوصية',
      tr: 'Şartlar & Gizlilik', ro: 'Termeni & Confidențialitate', hu: 'Feltételek & Adatvédelem',
      hi: 'नियम और गोपनीयता', fa: 'شرایط و حریم خصوصی', rom: 'Konditsii & Privatestv',
    },
    descs: {
      de: 'Maia\'s Voice dient nur zur Unterhaltung — kein Ersatz für medizinischen oder psychologischen Rat. Ich habe die Nutzungsbedingungen und den Datenschutz gelesen.',
      en: 'Maia\'s Voice is for entertainment only — not a substitute for medical or psychological advice. I have read the Terms and Privacy Policy.',
      ar: 'مايا فويس للترفيه فقط وليست بديلاً عن المشورة الطبية. لقد قرأت الشروط وسياسة الخصوصية.',
      tr: 'Maia\'s Voice yalnızca eğlence amaçlıdır. Şartları ve Gizlilik Politikasını okudum.',
      ro: 'Maia\'s Voice este doar pentru divertisment. Am citit Termenii și Politica de confidențialitate.',
      hu: 'A Maia\'s Voice csak szórakoztatásra szolgál. Elolvastam a feltételeket és az adatvédelmi irányelvet.',
      hi: 'माया\'ज़ वॉयस केवल मनोरंजन के लिए है। मैंने नियम और गोपनीयता नीति पढ़ी है।',
      fa: 'مایاز وویس فقط برای سرگرمی است. شرایط و سیاست حریم خصوصی را خوانده‌ام.',
      rom: 'Maia\'s Voice si korkoro baxtalipen. Me phendem o konditsii thaj privatesto.',
    },
  },
];

type Lang = 'de' | 'en' | 'ar' | 'tr' | 'ro' | 'hu' | 'hi' | 'fa' | 'rom';

function detectLang(): Lang {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('app_language');
      if (stored) return stored as Lang;
    }
  } catch {}
  return 'en';
}

export default function OnboardingConsentScreen() {
  const [consents, setConsents] = useState({ voice: false, data: false, sensitive: false, terms: false });
  const [retentionMonths, setRetentionMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang] = useState<Lang>(detectLang);

  const allRequired = consents.voice && consents.terms;

  function toggle(id: string) {
    setConsents((p) => ({ ...p, [id]: !p[id as keyof typeof p] }));
  }

  async function handleSpeak(id: string, title: string, desc: string) {
    if (speaking === id) { stopSpeaking(); setSpeaking(null); return; }
    setSpeaking(id);
    await speak(`${title}. ${desc}`);
    setSpeaking(null);
  }

  async function handleAccept() {
    if (!allRequired) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr || !user) throw new Error('Nicht eingeloggt / Not authenticated');

      const { error: profileErr } = await supabase.from('user_profiles').update({
        voice_consent: consents.voice,
        data_retention_consent: consents.data,
        data_retention_months: consents.data ? retentionMonths : null,
        onboarding_completed: true,
      }).eq('id', user.id);
      if (profileErr) throw profileErr;

      await supabase.from('consent_log').insert([
        { user_id: user.id, consent_type: 'voice_recording',          granted: consents.voice,     consent_text_version: '1.0' },
        { user_id: user.id, consent_type: 'data_retention',           granted: consents.data,      consent_text_version: '1.0' },
        { user_id: user.id, consent_type: 'sensitive_data_processing',granted: consents.sensitive, consent_text_version: '1.0' },
        { user_id: user.id, consent_type: 'terms_of_service',         granted: consents.terms,     consent_text_version: '1.0' },
        { user_id: user.id, consent_type: 'privacy_policy',           granted: consents.terms,     consent_text_version: '1.0' },
      ]);

      router.replace('/(tabs)/');
    } catch (err: any) {
      setError(err?.message ?? 'Unbekannter Fehler / Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const LABELS = {
    accept: { de: 'Allen zustimmen & fortfahren', en: 'Accept all & continue', ar: 'قبول الكل والمتابعة', tr: 'Tümünü kabul et', ro: 'Acceptă tot și continuă', hu: 'Mindent elfogad', hi: 'सब स्वीकार करें', fa: 'همه را بپذیر', rom: 'Primis sa but' },
    required: { de: '* Pflichtfeld', en: '* Required field', ar: '* مطلوب', tr: '* Zorunlu', ro: '* Obligatoriu', hu: '* Kötelező', hi: '* आवश्यक', fa: '* الزامی', rom: '* Musai' },
    hint: { de: '👆 Aktiviere Sprachaufnahme und Nutzungsbedingungen (*) um fortzufahren', en: '👆 Enable Voice Recording and Terms (*) to continue', ar: '👆 فعّل الحقول المطلوبة (*) للمتابعة', tr: '👆 Zorunlu alanları (*) etkinleştirin', ro: '👆 Activează câmpurile obligatorii (*)', hu: '👆 Kapcsold be a kötelező mezőket (*)', hi: '👆 आवश्यक फ़ील्ड (*) सक्षम करें', fa: '👆 فیلدهای اجباری (*) را فعال کنید', rom: '👆 Thav pes musai (*) te džas' },
    readTerms: { de: '📄 Nutzungsbedingungen lesen', en: '📄 Read Terms of Service', ar: '📄 اقرأ الشروط', tr: '📄 Şartları oku', ro: '📄 Citește termenii', hu: '📄 Feltételek olvasása', hi: '📄 नियम पढ़ें', fa: '📄 شرایط را بخوانید', rom: '📄 Len o konditsii' },
    readPrivacy: { de: '🔏 Datenschutz lesen', en: '🔏 Read Privacy Policy', ar: '🔏 اقرأ الخصوصية', tr: '🔏 Gizliliği oku', ro: '🔏 Politica de confidențialitate', hu: '🔏 Adatvédelem olvasása', hi: '🔏 गोपनीयता पढ़ें', fa: '🔏 حریم خصوصی را بخوانید', rom: '🔏 Len o privatesto' },
    retention: { de: 'Wie lange soll Maia sich erinnern?', en: 'How long should Maia remember?', ar: 'كم مدة تتذكر مايا؟', tr: 'Maia ne kadar hatırlasın?', ro: 'Cât timp să-și amintească Maia?', hu: 'Mennyi ideig emlékezzen Maia?', hi: 'माया कितने समय तक याद रखे?', fa: 'مایا چقدر باید به یاد بیاورد؟', rom: 'Kana but Maia te soven?' },
    listen: { de: 'Vorlesen', en: 'Listen', ar: 'استمع', tr: 'Dinle', ro: 'Ascultă', hu: 'Hallgasd', hi: 'सुनें', fa: 'گوش کن', rom: 'Ashunen' },
    stop: { de: 'Stopp', en: 'Stop', ar: 'توقف', tr: 'Dur', ro: 'Stop', hu: 'Stop', hi: 'रोकें', fa: 'توقف', rom: 'Mukhes' },
    subtitle: { de: 'Bevor wir beginnen — deine Einwilligung', en: 'Before we begin — your consent', ar: 'قبل أن نبدأ — موافقتك', tr: 'Başlamadan önce — onayın', ro: 'Înainte să începem — consimțământul tău', hu: 'Mielőtt elkezdjük — beleegyezésed', hi: 'शुरू करने से पहले — आपकी सहमति', fa: 'قبل از شروع — رضایت شما', rom: 'Anglal te šurav — tiri voja' },
  } as const;

  const l = (key: keyof typeof LABELS) => (LABELS[key] as any)[lang] ?? (LABELS[key] as any).en;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🔒</Text>
          <Text style={styles.title}>Maia's Voice</Text>
          <Text style={styles.subtitle}>{l('subtitle')}</Text>
        </View>

        {CONSENT_ITEMS.map((item) => {
          const title = (item.titles as any)[lang] ?? item.titles.en;
          const desc  = (item.descs as any)[lang]  ?? item.descs.en;
          const isOn  = consents[item.id as keyof typeof consents];
          const isPlaying = speaking === item.id;

          return (
            <View key={item.id} style={[styles.card, isOn && styles.cardOn]}>
              <View style={styles.cardRow}>
                <Text style={styles.cardIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {title}
                    {item.required && <Text style={styles.star}> *</Text>}
                  </Text>
                </View>
                <Switch
                  value={isOn}
                  onValueChange={() => toggle(item.id)}
                  trackColor={{ false: C.border, true: C.gold }}
                  thumbColor={isOn ? C.white : C.textMuted}
                />
              </View>

              <Text style={styles.cardDesc}>{desc}</Text>

              {item.id === 'terms' && (
                <View style={styles.legalRow}>
                  <TouchableOpacity onPress={() => router.push('/(auth)/terms')}>
                    <Text style={styles.legalLink}>{l('readTerms')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/(auth)/privacy')}>
                    <Text style={styles.legalLink}>{l('readPrivacy')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.id === 'data' && isOn && (
                <View style={styles.retention}>
                  <Text style={styles.retLabel}>{l('retention')}</Text>
                  <View style={styles.retBtns}>
                    {[3, 6, 12].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.retBtn, retentionMonths === m && styles.retBtnOn]}
                        onPress={() => setRetentionMonths(m)}
                      >
                        <Text style={[styles.retBtnText, retentionMonths === m && styles.retBtnTextOn]}>
                          {m} {lang === 'de' ? 'Mon.' : 'mo.'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.audioBtn, isPlaying && styles.audioBtnOn]}
                onPress={() => handleSpeak(item.id, title, desc)}
              >
                <Text style={styles.audioBtnText}>
                  {isPlaying ? `⏹ ${l('stop')}` : `🔊 ${l('listen')}`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <Text style={styles.reqNote}>{l('required')}</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.acceptBtn, !allRequired && styles.acceptBtnOff]}
          onPress={handleAccept}
          disabled={!allRequired || loading}
        >
          {loading
            ? <ActivityIndicator color={C.bg} />
            : <Text style={styles.acceptBtnText}>{l('accept')}</Text>
          }
        </TouchableOpacity>

        {!allRequired && <Text style={styles.hintText}>{l('hint')}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, gap: 16, paddingBottom: 60 },

  header:   { alignItems: 'center', gap: 6, paddingTop: 16, marginBottom: 4 },
  logo:     { fontSize: 40 },
  title:    { fontSize: 24, fontWeight: '800', color: C.white, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: C.textSec, textAlign: 'center' },

  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    gap: 12,
    borderWidth: 2,
    borderColor: C.border,
  },
  cardOn:   { borderColor: C.gold, backgroundColor: C.surfaceUp },
  cardRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { fontSize: 26 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.white, flexShrink: 1 },
  star:     { color: C.gold },
  cardDesc: { fontSize: 14, color: C.textSec, lineHeight: 21 },

  legalRow: { gap: 8 },
  legalLink: { color: C.goldBright, fontSize: 13, textDecorationLine: 'underline' },

  retention: { gap: 8 },
  retLabel:  { color: C.textSec, fontSize: 13 },
  retBtns:   { flexDirection: 'row', gap: 8 },
  retBtn:    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  retBtnOn:  { borderColor: C.gold, backgroundColor: C.surfaceUp },
  retBtnText: { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  retBtnTextOn: { color: C.gold },

  audioBtn:  { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  audioBtnOn: { borderColor: C.gold },
  audioBtnText: { color: C.textSec, fontSize: 12, fontWeight: '600' },

  reqNote:  { color: C.textMuted, fontSize: 12, textAlign: 'center' },
  errorBox: { backgroundColor: C.errorBg, borderRadius: 12, borderWidth: 1.5, borderColor: C.errorBorder, padding: 14 },
  errorText: { color: C.error, fontSize: 14, lineHeight: 20 },

  acceptBtn:    { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 4 },
  acceptBtnOff: { opacity: 0.3 },
  acceptBtnText: { color: C.bg, fontSize: 16, fontWeight: '800' },
  hintText:     { color: C.textMuted, fontSize: 12, textAlign: 'center', marginTop: -8 },
});
