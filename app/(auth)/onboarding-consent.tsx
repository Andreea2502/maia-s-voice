import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Switch, SafeAreaView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

// All translations inline — no i18n dependency needed here
const CONSENT_ITEMS = [
  {
    id: 'voice',
    icon: '🎙️',
    required: true,
    titles: {
      de: 'Sprachaufnahme', en: 'Voice Recording', ar: 'تسجيل الصوت',
      tr: 'Ses Kaydı', ro: 'Înregistrare vocală', hu: 'Hangfelvétel',
      hi: 'आवाज़ रिकॉर्डिंग', fa: 'ضبط صدا', rom: 'Glaso-înregistrimos',
    },
    descs: {
      de: 'Die App nimmt deine Stimme auf, damit Maia dir antworten kann. Die Aufnahme wird nur für deine Sitzung verwendet.',
      en: 'The app records your voice so Maia can respond to you. Recordings are used only for your session.',
      ar: 'يسجّل التطبيق صوتك حتى تستطيع مايا الرد عليك. تُستخدم التسجيلات فقط لجلستك.',
      tr: 'Uygulama, Maia\'nın sana yanıt verebilmesi için sesini kaydeder. Kayıtlar yalnızca senin oturumun için kullanılır.',
      ro: 'Aplicația îți înregistrează vocea pentru ca Maia să îți poată răspunde. Înregistrările sunt folosite doar pentru sesiunea ta.',
      hu: 'Az alkalmazás rögzíti a hangodat, hogy Maia válaszolhasson neked. A felvételeket csak a te munkamenetedhez használják.',
      hi: 'ऐप आपकी आवाज़ रिकॉर्ड करता है ताकि माया आपको जवाब दे सके। रिकॉर्डिंग केवल आपके सत्र के लिए उपयोग की जाती है।',
      fa: 'اپلیکیشن صدای شما را ضبط می‌کند تا مایا بتواند به شما پاسخ دهد. ضبط‌ها فقط برای جلسه شما استفاده می‌شوند.',
      rom: 'I aplikacia thol pes tiro glaso te šaj Maia del tuke responsa. O înregistrimos si korkoro tiri sesiya.',
    },
  },
  {
    id: 'data',
    icon: '💾',
    required: false,
    titles: {
      de: 'Gesprächsgedächtnis', en: 'Conversation Memory', ar: 'ذاكرة المحادثة',
      tr: 'Konuşma Hafızası', ro: 'Memoria conversației', hu: 'Beszélgetés memória',
      hi: 'बातचीत की याददाश्त', fa: 'حافظه مکالمه', rom: 'Vorba-memorimos',
    },
    descs: {
      de: 'Maia kann sich an frühere Gespräche erinnern, damit sie dir persönlichere Antworten geben kann. Du kannst das jederzeit ausschalten.',
      en: 'Maia can remember previous conversations to give you more personal responses. You can turn this off at any time.',
      ar: 'تستطيع مايا أن تتذكر المحادثات السابقة لتقديم ردود أكثر شخصية. يمكنك إيقاف هذا في أي وقت.',
      tr: 'Maia, sana daha kişisel yanıtlar verebilmek için önceki konuşmaları hatırlayabilir. Bunu istediğin zaman kapatabilirsin.',
      ro: 'Maia poate să-și amintească conversațiile anterioare pentru a-ți oferi răspunsuri mai personale. Poți dezactiva oricând.',
      hu: 'Maia emlékezhet a korábbi beszélgetésekre, hogy személyesebb válaszokat adhasson. Ezt bármikor kikapcsolhatod.',
      hi: 'माया पिछली बातचीत याद रख सकती है ताकि आपको अधिक व्यक्तिगत जवाब दे सके। आप इसे कभी भी बंद कर सकते हैं।',
      fa: 'مایا می‌تواند مکالمات قبلی را به یاد بیاورد تا پاسخ‌های شخصی‌تری بدهد. می‌توانید این را هر زمان خاموش کنید.',
      rom: 'Maia šaj soven pes pal anglune vorba te del tuke personaleder responsa. Tu šaj mukh les korkori.',
    },
  },
  {
    id: 'sensitive',
    icon: '🌙',
    required: false,
    titles: {
      de: 'Persönliche Themen', en: 'Personal Topics', ar: 'مواضيع شخصية',
      tr: 'Kişisel Konular', ro: 'Subiecte personale', hu: 'Személyes témák',
      hi: 'व्यक्तिगत विषय', fa: 'موضوعات شخصی', rom: 'Personalune temata',
    },
    descs: {
      de: 'Tarot-Gespräche können persönliche Themen berühren. Diese Daten verlassen nie dein Gerät ohne deine Erlaubnis.',
      en: 'Tarot conversations may touch on personal topics. This data never leaves your device without your permission.',
      ar: 'قد تتطرق محادثات التاروت إلى مواضيع شخصية. لن تغادر هذه البيانات جهازك أبدًا دون إذنك.',
      tr: 'Tarot konuşmaları kişisel konulara değinebilir. Bu veriler, iznin olmadan asla cihazını terk etmez.',
      ro: 'Conversațiile Tarot pot atinge subiecte personale. Aceste date nu părăsesc niciodată dispozitivul tău fără permisiunea ta.',
      hu: 'A tarot-beszélgetések személyes témákat érinthetnek. Ezek az adatok soha nem hagyják el az eszközödet az engedélyed nélkül.',
      hi: 'टैरो बातचीत व्यक्तिगत विषयों को छू सकती है। यह डेटा आपकी अनुमति के बिना कभी भी आपके डिवाइस को नहीं छोड़ता।',
      fa: 'مکالمات تاروت ممکن است به موضوعات شخصی بپردازند. این داده‌ها بدون اجازه شما هرگز دستگاه شما را ترک نمی‌کنند.',
      rom: 'Tarot-vorba šaj len pes personalune temata. Kava data na džan katar tiro aparato bi tiri voja.',
    },
  },
  {
    id: 'terms',
    icon: '📋',
    required: true,
    titles: {
      de: 'Nutzungsbedingungen & Datenschutz', en: 'Terms & Privacy Policy', ar: 'الشروط والخصوصية',
      tr: 'Şartlar & Gizlilik', ro: 'Termeni & Confidențialitate', hu: 'Feltételek & Adatvédelem',
      hi: 'नियम और गोपनीयता', fa: 'شرایط و حریم خصوصی', rom: 'Konditsii & Privatesтво',
    },
    descs: {
      de: 'Maia\'s Voice dient nur zur Unterhaltung und ist kein Ersatz für medizinische oder psychologische Beratung. Ich habe die Nutzungsbedingungen und Datenschutzerklärung gelesen.',
      en: 'Maia\'s Voice is for entertainment only and is not a substitute for medical or psychological advice. I have read the Terms and Privacy Policy.',
      ar: 'مايا فويس للترفيه فقط وليست بديلاً عن المشورة الطبية أو النفسية. لقد قرأت الشروط وسياسة الخصوصية.',
      tr: 'Maia\'s Voice yalnızca eğlence amaçlıdır ve tıbbi veya psikolojik tavsiyenin yerini tutmaz. Şartları ve Gizlilik Politikasını okudum.',
      ro: 'Maia\'s Voice este doar pentru divertisment și nu înlocuiește sfatul medical sau psihologic. Am citit Termenii și Politica de confidențialitate.',
      hu: 'A Maia\'s Voice csak szórakoztatásra szolgál, és nem helyettesíti az orvosi vagy pszichológiai tanácsadást. Elolvastam a feltételeket és az adatvédelmi irányelvet.',
      hi: 'माया\'ज़ वॉयस केवल मनोरंजन के लिए है और चिकित्सा या मनोवैज्ञानिक सलाह का विकल्प नहीं है। मैंने नियम और गोपनीयता नीति पढ़ी है।',
      fa: 'مایاز وویس فقط برای سرگرمی است و جایگزین مشاوره پزشکی یا روانشناختی نیست. شرایط و سیاست حریم خصوصی را خوانده‌ام.',
      rom: 'Maia\'s Voice si korkoro baxtalipen te na vi medikano sfat. Me phendem o konditsii thaj privatesto.',
    },
  },
];

type Lang = 'de' | 'en' | 'ar' | 'tr' | 'ro' | 'hu' | 'hi' | 'fa' | 'rom';

function speak(text: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }
}

export default function OnboardingConsentScreen() {
  const [consents, setConsents] = useState<Record<string, boolean>>({
    voice: false, data: false, sensitive: false, terms: false,
  });
  const [retentionMonths, setRetentionMonths] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to detect language — fall back to 'en'
  const [lang] = useState<Lang>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = typeof localStorage !== 'undefined'
          ? localStorage.getItem('app_language')
          : null;
        if (stored) return stored as Lang;
      }
    } catch {}
    return 'en';
  });

  const allRequired = consents.voice && consents.terms;

  function toggle(id: string) {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
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
        { user_id: user.id, consent_type: 'voice_recording', granted: consents.voice, consent_text_version: '1.0' },
        { user_id: user.id, consent_type: 'data_retention', granted: consents.data, consent_text_version: '1.0' },
        { user_id: user.id, consent_type: 'sensitive_data_processing', granted: consents.sensitive, consent_text_version: '1.0' },
        { user_id: user.id, consent_type: 'terms_of_service', granted: consents.terms, consent_text_version: '1.0' },
        { user_id: user.id, consent_type: 'privacy_policy', granted: consents.terms, consent_text_version: '1.0' },
      ]);

      router.replace('/(tabs)/');
    } catch (err: any) {
      setError(err?.message ?? 'Unbekannter Fehler / Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const acceptLabel: Record<Lang, string> = {
    de: 'Allen zustimmen & fortfahren',
    en: 'Accept all & continue',
    ar: 'قبول الكل والمتابعة',
    tr: 'Tümünü kabul et ve devam et',
    ro: 'Acceptă tot și continuă',
    hu: 'Mindent elfogad & folytatás',
    hi: 'सब स्वीकार करें और जारी रखें',
    fa: 'همه را بپذیر و ادامه بده',
    rom: 'Primis sa but thaj dža angle',
  };

  const requiredLabel: Record<Lang, string> = {
    de: '* Pflichtfeld — muss aktiviert sein um fortzufahren',
    en: '* Required — must be enabled to continue',
    ar: '* مطلوب — يجب تفعيله للمتابعة',
    tr: '* Zorunlu — devam etmek için etkinleştirilmeli',
    ro: '* Obligatoriu — trebuie activat pentru a continua',
    hu: '* Kötelező — be kell kapcsolni a folytatáshoz',
    hi: '* आवश्यक — जारी रखने के लिए सक्षम होना चाहिए',
    fa: '* الزامی — برای ادامه باید فعال شود',
    rom: '* Musai — trel te ovel thardo te džas angle',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🔒</Text>
          <Text style={styles.title}>Maia's Voice</Text>
          <Text style={styles.subtitle}>
            {lang === 'de' ? 'Bevor wir beginnen — deine Einwilligung' :
             lang === 'ar' ? 'قبل أن نبدأ — موافقتك' :
             lang === 'tr' ? 'Başlamadan önce — onayın' :
             lang === 'ro' ? 'Înainte să începem — consimțământul tău' :
             lang === 'hu' ? 'Mielőtt elkezdjük — a beleegyezésed' :
             lang === 'hi' ? 'शुरू करने से पहले — आपकी सहमति' :
             lang === 'fa' ? 'قبل از شروع — رضایت شما' :
             lang === 'rom' ? 'Anglal te šurav — tiri voja' :
             'Before we begin — your consent'}
          </Text>
        </View>

        {/* Consent items */}
        {CONSENT_ITEMS.map((item) => {
          const title = item.titles[lang] ?? item.titles.en;
          const desc = item.descs[lang] ?? item.descs.en;
          const isOn = consents[item.id];
          return (
            <View key={item.id} style={[styles.card, isOn && styles.cardActive]}>
              <View style={styles.cardHeader}>
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
                  trackColor={{ false: '#3A2A5A', true: '#C9956A' }}
                  thumbColor={isOn ? '#F5E6D0' : '#8070A0'}
                />
              </View>
              <Text style={styles.cardDesc}>{desc}</Text>

              {/* Terms links */}
              {item.id === 'terms' && (
                <View style={styles.legalLinks}>
                  <TouchableOpacity onPress={() => router.push('/(auth)/terms')}>
                    <Text style={styles.legalLink}>
                      {lang === 'de' ? '📄 Nutzungsbedingungen lesen' :
                       lang === 'ar' ? '📄 اقرأ الشروط' :
                       lang === 'tr' ? '📄 Şartları oku' :
                       '📄 Read Terms of Service'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/(auth)/privacy')}>
                    <Text style={styles.legalLink}>
                      {lang === 'de' ? '🔏 Datenschutzerklärung lesen' :
                       lang === 'ar' ? '🔏 اقرأ الخصوصية' :
                       lang === 'tr' ? '🔏 Gizliliği oku' :
                       '🔏 Read Privacy Policy'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Data retention selector */}
              {item.id === 'data' && isOn && (
                <View style={styles.retention}>
                  <Text style={styles.retentionLabel}>
                    {lang === 'de' ? 'Wie lange soll Maia sich erinnern?' : 'How long should Maia remember?'}
                  </Text>
                  <View style={styles.retentionBtns}>
                    {[3, 6, 12].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.retBtn, retentionMonths === m && styles.retBtnActive]}
                        onPress={() => setRetentionMonths(m)}
                      >
                        <Text style={[styles.retBtnText, retentionMonths === m && styles.retBtnTextActive]}>
                          {m} {lang === 'de' ? 'Mon.' : 'mo.'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Audio button */}
              <TouchableOpacity style={styles.audioBtn} onPress={() => speak(`${title}. ${desc}`)}>
                <Text style={styles.audioBtnText}>🔊 {lang === 'de' ? 'Vorlesen' : lang === 'ar' ? 'استمع' : lang === 'tr' ? 'Dinle' : 'Listen'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <Text style={styles.requiredNote}>{requiredLabel[lang] ?? requiredLabel.en}</Text>

        {/* Error box */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Accept button */}
        <TouchableOpacity
          style={[styles.acceptBtn, !allRequired && styles.acceptBtnOff]}
          onPress={handleAccept}
          disabled={!allRequired || loading}
          accessibilityRole="button"
          accessibilityLabel={acceptLabel[lang]}
        >
          {loading
            ? <ActivityIndicator color="#1A0A2E" />
            : <Text style={styles.acceptBtnText}>{acceptLabel[lang] ?? acceptLabel.en}</Text>
          }
        </TouchableOpacity>

        {!allRequired && (
          <Text style={styles.hintText}>
            {lang === 'de'
              ? '👆 Aktiviere die markierten Pflichtfelder (*) um fortzufahren'
              : '👆 Enable the required fields (*) to continue'}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0A1E' },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  header: { alignItems: 'center', gap: 6, paddingTop: 16, marginBottom: 8 },
  logo: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#C0B0E0', textAlign: 'center' },
  card: {
    backgroundColor: '#1A1035',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 2,
    borderColor: '#3A2A5A',
  },
  cardActive: { borderColor: '#C9956A', backgroundColor: '#1E1240' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { fontSize: 24 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  star: { color: '#C9956A' },
  cardDesc: { fontSize: 14, color: '#C0B0E0', lineHeight: 20 },
  legalLinks: { gap: 6, marginTop: 4 },
  legalLink: { color: '#C9956A', fontSize: 13, textDecorationLine: 'underline' },
  retention: { gap: 8 },
  retentionLabel: { color: '#C0B0E0', fontSize: 13 },
  retentionBtns: { flexDirection: 'row', gap: 8 },
  retBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: '#3A2A5A',
    backgroundColor: '#0D0A1E',
  },
  retBtnActive: { borderColor: '#C9956A', backgroundColor: '#2A1A40' },
  retBtnText: { color: '#8070A0', fontSize: 13, fontWeight: '600' },
  retBtnTextActive: { color: '#C9956A' },
  audioBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#3A2A5A',
    backgroundColor: '#0D0A1E',
  },
  audioBtnText: { color: '#C0B0E0', fontSize: 12 },
  requiredNote: { color: '#8070A0', fontSize: 12, textAlign: 'center' },
  errorBox: {
    backgroundColor: '#3A0A0A',
    borderRadius: 12, borderWidth: 1, borderColor: '#CC3333',
    padding: 14,
  },
  errorText: { color: '#FF8080', fontSize: 14, lineHeight: 20 },
  acceptBtn: {
    backgroundColor: '#C9956A', borderRadius: 14,
    paddingVertical: 18, alignItems: 'center', marginTop: 4,
  },
  acceptBtnOff: { opacity: 0.35 },
  acceptBtnText: { color: '#1A0A2E', fontSize: 16, fontWeight: '800' },
  hintText: { color: '#8070A0', fontSize: 12, textAlign: 'center', marginTop: -8 },
});
