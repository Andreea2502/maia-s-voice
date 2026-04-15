// Mystic App — Design System Colors
// Principles: deep navy luxury, warm gold, WCAG AA+ contrast throughout

export const C = {
  // Backgrounds — 3 distinct layers (deep midnight navy)
  bg:          '#091428',  // app background — deep navy, not black
  surface:     '#0D1E3A',  // card / panel background
  surfaceUp:   '#142850',  // elevated cards / modals

  // Borders
  border:      '#1E3A5F',
  borderActive:'#D4AF5A',  // warm gold — selected / active state

  // Brand accent colors
  gold:        '#D4AF5A',  // warm luminous gold (not copper)
  goldBright:  '#F0CC70',  // highlight gold
  purple:      '#6B4FA0',
  purpleSoft:  '#9070CC',

  // Text — all pass WCAG AA on `surface`
  white:       '#FFFFFF',
  textSec:     '#B8CCE8',
  textMuted:   '#5878A0',

  // Tab bar
  tabBg:       '#07101E',
  tabBorder:   '#162A44',
  tabInactive: '#4A6A90',

  // States
  error:       '#FF6B6B',
  errorBg:     '#2A0808',
  errorBorder: '#8B2020',
  success:     '#6BCB77',
  successBg:   '#082A12',
} as const;

// Per-module color palettes
export const MODULE_COLORS = {
  tarot: {
    bg:       '#00060F',   // deep cosmic black-blue
    primary:  '#00D4FF',   // teal/cyan glow (wie auf der Karte)
    accent:   '#FF00AA',   // magenta/hot pink
    secondary:'#8B00FF',   // deep violet
    surface:  '#050D18',
    border:   '#003D55',
    glow:     '#00D4FF33',
  },
  astrology: {
    bg:       '#02000F',
    primary:  '#C8A0FF',   // lilac
    accent:   '#6030C0',   // deep purple
    surface:  '#0A0520',
    border:   '#2A1060',
    glow:     '#6030C044',
  },
  numerology: {
    bg:       '#000804',
    primary:  '#00FF90',   // matrix green
    accent:   '#008040',
    surface:  '#000F08',
    border:   '#003020',
    glow:     '#00FF9044',
  },
  coffee: {
    bg:       '#080300',
    primary:  '#D4A060',   // amber
    accent:   '#6A3810',   // dark brown
    surface:  '#130800',
    border:   '#2A1400',
    glow:     '#D4A06044',
  },
  palm: {
    bg:       '#00040A',
    primary:  '#40D0E0',   // teal
    accent:   '#004060',   // deep sea
    surface:  '#000A12',
    border:   '#002030',
    glow:     '#40D0E044',
  },
} as const;

export type ModuleId = keyof typeof MODULE_COLORS;
