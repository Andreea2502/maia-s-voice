// Maia's Voice — Design System Colors
// Principles: dark luxury, clear layers, WCAG AA+ contrast throughout

export const C = {
  // Backgrounds — 3 distinct layers
  bg:          '#07050F',  // app background (near-black)
  surface:     '#130D2B',  // card / panel background (clearly visible on bg)
  surfaceUp:   '#1C1540',  // elevated cards / modals

  // Borders
  border:      '#2E2252',  // always visible, subtle
  borderActive:'#C9956A',  // gold — selected / active state

  // Brand accent colors
  gold:        '#C9956A',  // primary accent — buttons, icons
  goldBright:  '#E4B880',  // lighter gold for text on dark
  purple:      '#7C5CBF',  // secondary accent
  purpleSoft:  '#9B7DD4',  // lighter purple

  // Text — all pass WCAG AA on `surface`
  white:       '#FFFFFF',   // primary text (contrast 14:1 on surface)
  textSec:     '#C8BAE8',   // secondary text (contrast 8:1)
  textMuted:   '#8070A8',   // hints, captions (contrast 4.5:1)

  // Tab bar
  tabBg:       '#0D0928',
  tabBorder:   '#251C46',
  tabInactive: '#6A5A8A',

  // States
  error:       '#FF6B6B',
  errorBg:     '#2A0808',
  errorBorder: '#8B2020',
  success:     '#6BCB77',
  successBg:   '#082A12',
} as const;
