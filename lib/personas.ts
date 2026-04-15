// Mystic App — Voice Personas
//
// ÜBERSTIMME: Universal guide — used in Onboarding + all non-Tarot modules
// TAROT PERSONAS: Luna / Zara / Maya — selectable only inside the Tarot module

export type PersonaId = 'luna' | 'zara' | 'maya';
export type VoiceRole = 'master' | 'tarot';

export interface Persona {
  id: PersonaId;
  role: VoiceRole;
  name: Record<string, string>;
  tagline: Record<string, string>;
  description: Record<string, string>;
  personality: Record<string, string>;
  elevenLabsVoiceId: string;
  elevenLabsAgentId: string;
  style: 'warm' | 'mystical' | 'direct';
  culturalAffinity: string[];
  avatarUrl: any;
  accentColor: string;
  backgroundGradient: [string, string];
  introText: Record<string, string>;
}

// Überstimme — universal, warm, used for Onboarding + Astrology / Numerology / Coffee / Palm
export const MASTER_VOICE = {
  voiceId: 'ELEVENLABS_MASTER_VOICE_ID',   // TODO: fill in
  agentId: 'ELEVENLABS_MASTER_AGENT_ID',   // TODO: fill in
  name: 'Mystic',
  personality: 'warm, wise, universal guide — speaks the user\'s language',
} as const;

// Tarot Personas — selectable before a Tarot reading
export const PERSONAS: Persona[] = [
  {
    id: 'luna',
    role: 'tarot',
    name: {
      de: 'Luna',
      en: 'Luna',
      ar: 'لونا',
      tr: 'Luna',
      hi: 'लूना',
      ro: 'Luna',
      hu: 'Luna',
      fa: 'لونا',
      rom: 'Luna',
    },
    tagline: {
      de: 'Sanft & poetisch',
      en: 'Gentle & poetic',
      ar: 'لطيفة وشاعرية',
      tr: 'Nazik ve şiirsel',
      hi: 'कोमल और काव्यात्मक',
      ro: 'Blândă și poetică',
      hu: 'Gyengéd és költői',
      fa: 'لطیف و شاعرانه',
      rom: 'Nažno thaj poetic',
    },
    description: {
      de: 'Luna ist wie das Mondlicht – sanft, einfühlsam und zutiefst poetisch. Sie findet in den Karten Bilder, die dein Herz direkt berühren.',
      en: 'Luna is like moonlight — gentle, empathetic and deeply poetic. She finds images in the cards that touch your heart directly.',
      ar: 'لونا مثل ضوء القمر — لطيفة ومتعاطفة وشاعرية عميقة.',
      tr: 'Luna ay ışığı gibidir — nazik, empatik ve derin bir şekilde şiirsel.',
      hi: 'लूना चाँदनी जैसी हैं — कोमल, सहानुभूतिपूर्ण और गहरी काव्यात्मक।',
    },
    personality: {
      de: 'Warm, fließend, poetisch, einfühlsam, träumerisch',
      en: 'Warm, flowing, poetic, empathetic, dreamy',
    },
    elevenLabsVoiceId: 'VOICE_ID_LUNA',    // TODO: fill in
    elevenLabsAgentId: 'AGENT_ID_LUNA',    // TODO: fill in
    style: 'warm',
    culturalAffinity: ['de', 'en', 'ro', 'hu'],
    avatarUrl: require('../assets/personas/elena.png'),  // replace with luna.png
    accentColor: '#C9956A',
    backgroundGradient: ['#1a0a2e', '#2d1b4e'],
    introText: {
      de: 'Ich bin Luna. Die Karten sprechen in Bildern, und ich übersetze sie für dein Herz. Lass uns gemeinsam in das Licht des Monds eintauchen.',
      en: 'I am Luna. The cards speak in images, and I translate them for your heart. Let us dive together into the light of the moon.',
      ar: 'أنا لونا. البطاقات تتحدث بالصور، وأنا أترجمها لقلبك.',
    },
  },
  {
    id: 'zara',
    role: 'tarot',
    name: {
      de: 'Zara',
      en: 'Zara',
      ar: 'زارا',
      tr: 'Zara',
      hi: 'ज़ारा',
      ro: 'Zara',
      hu: 'Zara',
      fa: 'زارا',
      rom: 'Zara',
    },
    tagline: {
      de: 'Direkt & scharf',
      en: 'Direct & sharp',
      ar: 'مباشرة وحادة',
      tr: 'Direkt ve keskin',
      hi: 'सीधी और तेज़',
      ro: 'Directă și ascuțită',
      hu: 'Közvetlen és éles',
      fa: 'مستقیم و تیز',
      rom: 'Direkno thaj tikno',
    },
    description: {
      de: 'Zara sagt, was sie sieht – klar, direkt, ohne Ausweichen. Sie hilft dir, die Wahrheit zu sehen, auch wenn sie unbequem ist.',
      en: 'Zara says what she sees — clear, direct, without evasion. She helps you see the truth, even when it is uncomfortable.',
      ar: 'زارا تقول ما تراه — بوضوح ومباشرة، دون تهرب.',
      tr: 'Zara gördüğünü söyler — net, doğrudan, kaçınma olmadan.',
      hi: 'ज़ारा जो देखती हैं वो कहती हैं — स्पष्ट, सीधी, बिना टालमटोल के।',
    },
    personality: {
      de: 'Direkt, analytisch, präzise, herausfordernd, klar',
      en: 'Direct, analytical, precise, challenging, clear',
    },
    elevenLabsVoiceId: 'VOICE_ID_ZARA',    // TODO: fill in
    elevenLabsAgentId: 'AGENT_ID_ZARA',    // TODO: fill in
    style: 'direct',
    culturalAffinity: ['de', 'en', 'ar', 'tr', 'hi'],
    avatarUrl: require('../assets/personas/priya.png'),  // replace with zara.png
    accentColor: '#E07B4A',
    backgroundGradient: ['#1a0f0a', '#2e1a0d'],
    introText: {
      de: 'Ich bin Zara. Ich sage, was ich sehe – direkt und ohne Umschweife. Bist du bereit für die Wahrheit?',
      en: 'I am Zara. I say what I see — direct and without detour. Are you ready for the truth?',
      ar: 'أنا زارا. أقول ما أراه — مباشرة ودون مواربة. هل أنت مستعد للحقيقة؟',
      hi: 'मैं ज़ारा हूं। मैं जो देखती हूं वो कहती हूं — सीधे और बिना घुमाए। क्या आप सच के लिए तैयार हैं?',
    },
  },
  {
    id: 'maya',
    role: 'tarot',
    name: {
      de: 'Maya',
      en: 'Maya',
      ar: 'مايا',
      tr: 'Maya',
      hi: 'माया',
      ro: 'Maya',
      hu: 'Maya',
      fa: 'مایا',
      rom: 'Maya',
    },
    tagline: {
      de: 'Weise & tiefgründig',
      en: 'Wise & profound',
      ar: 'حكيمة وعميقة',
      tr: 'Bilge ve derin',
      hi: 'ज्ञानी और गहन',
      ro: 'Înțeleaptă și profundă',
      hu: 'Bölcs és mély',
      fa: 'خردمند و عمیق',
      rom: 'Godžavni thaj phundo',
    },
    description: {
      de: 'Maya verbindet jahrhundertealte Weisheit mit dem Tarot. Ruhig, würdevoll und tiefgründig führt sie dich in die Stille deines Inneren.',
      en: 'Maya bridges centuries-old wisdom with the tarot. Calm, dignified and profound, she leads you into the quiet of your inner world.',
      ar: 'مايا تجمع بين الحكمة العريقة والتاروت. هادئة وكريمة وعميقة.',
      tr: 'Maya, yüzyıllık bilgeliği tarot ile birleştirir. Sakin, onurlu ve derin.',
      hi: 'माया सदियों पुरानी बुद्धि को टैरो के साथ जोड़ती हैं। शांत, गरिमामय और गहन।',
      fa: 'مایا حکمت قرن‌ها را با تاروت پیوند می‌دهد. آرام، باوقار و عمیق.',
    },
    personality: {
      de: 'Ruhig, tiefgründig, würdevoll, mütterlich, spirituell',
      en: 'Calm, profound, dignified, maternal, spiritual',
    },
    elevenLabsVoiceId: 'VOICE_ID_MAYA',    // TODO: fill in
    elevenLabsAgentId: 'AGENT_ID_MAYA',    // TODO: fill in
    style: 'mystical',
    culturalAffinity: ['ar', 'fa', 'tr', 'hi', 'de', 'en'],
    avatarUrl: require('../assets/personas/amira.png'),  // replace with maya.png
    accentColor: '#7B5EA7',
    backgroundGradient: ['#0d0a1e', '#1a0d3a'],
    introText: {
      de: 'Ich bin Maya. Die Karten sind kein Zufall – sie zeigen, was deine Seele bereits weiß. Lass uns gemeinsam in die Tiefe gehen.',
      en: 'I am Maya. The cards are not coincidence — they reveal what your soul already knows. Let us go deep together.',
      ar: 'أنا مايا. البطاقات ليست صدفة — إنها تكشف ما تعرفه روحك بالفعل.',
      hi: 'मैं माया हूं। पत्ते संयोग नहीं हैं — वे वो दिखाते हैं जो आपकी आत्मा पहले से जानती है।',
      fa: 'من مایا هستم. کارت‌ها اتفاقی نیستند — آنها آنچه روح شما می‌داند را آشکار می‌کنند.',
    },
  },
];

export function getPersonaById(id: PersonaId): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

// Active voice for a given context:
// - In Tarot module with selected persona → that persona
// - Everywhere else → MASTER_VOICE
export function getActiveVoice(module: string, selectedPersona?: PersonaId | null) {
  if (module === 'tarot' && selectedPersona) {
    return { type: 'persona' as const, persona: getPersonaById(selectedPersona) };
  }
  return { type: 'master' as const, voice: MASTER_VOICE };
}
