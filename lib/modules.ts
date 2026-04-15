import { MODULE_COLORS } from './colors';

export type ModuleId = 'tarot' | 'astrology' | 'numerology' | 'coffee' | 'palm';
export type ModuleStatus = 'active' | 'locked';

export interface MysticModule {
  id: ModuleId;
  nameKey: string;           // i18n key
  descriptionKey: string;    // i18n key
  icon: string;              // Unicode symbol (SVGs added in Phase 2)
  status: ModuleStatus;
  colors: typeof MODULE_COLORS[ModuleId];
  route: string;
  hasVision: boolean;        // requires camera/photo upload
  hasThreeJS: boolean;       // uses Three.js 3D scene
}

export const MODULES: MysticModule[] = [
  {
    id: 'tarot',
    nameKey: 'modules.tarot.name',
    descriptionKey: 'modules.tarot.description',
    icon: '✦',
    status: 'active',
    colors: MODULE_COLORS.tarot,
    route: '/tarot',
    hasVision: false,
    hasThreeJS: true,
  },
  {
    id: 'astrology',
    nameKey: 'modules.astrology.name',
    descriptionKey: 'modules.astrology.description',
    icon: '✧',
    status: 'active',
    colors: MODULE_COLORS.astrology,
    route: '/astrology',
    hasVision: false,
    hasThreeJS: false,
  },
  {
    id: 'numerology',
    nameKey: 'modules.numerology.name',
    descriptionKey: 'modules.numerology.description',
    icon: '∞',
    status: 'locked',
    colors: MODULE_COLORS.numerology,
    route: '/numerology',
    hasVision: false,
    hasThreeJS: false,
  },
  {
    id: 'coffee',
    nameKey: 'modules.coffee.name',
    descriptionKey: 'modules.coffee.description',
    icon: '☽',
    status: 'locked',
    colors: MODULE_COLORS.coffee,
    route: '/coffee',
    hasVision: true,
    hasThreeJS: false,
  },
  {
    id: 'palm',
    nameKey: 'modules.palm.name',
    descriptionKey: 'modules.palm.description',
    icon: '✿',
    status: 'locked',
    colors: MODULE_COLORS.palm,
    route: '/palm',
    hasVision: true,
    hasThreeJS: false,
  },
];

export function getModule(id: ModuleId): MysticModule {
  return MODULES.find((m) => m.id === id)!;
}

export function getActiveModules(): MysticModule[] {
  return MODULES.filter((m) => m.status === 'active');
}
