export type Arcana = 'major' | 'minor';
export type Suit = 'cups' | 'wands' | 'swords' | 'pentacles';
export type Orientation = 'upright' | 'reversed';

export type SpreadType =
  | 'single'
  | 'three_card'
  | 'celtic_cross'
  | 'love_spread'
  | 'career_spread'
  | 'yes_no'
  | 'past_present_future';

export interface CardLibraryEntry {
  id: string; // "major_00_fool", "minor_cups_01_ace"
  arcana: Arcana;
  suit?: Suit;
  number?: number;
  nameTranslations: Record<string, string>;
  meaningUpright: Record<string, string>;
  meaningReversed: Record<string, string>;
  keywords: Record<string, string[]>;
  imageUrl?: string;
  visualDescription?: string;
}

export interface DrawnCard {
  position: number;
  cardId: string;
  orientation: Orientation;
  recognizedFromPhoto: boolean;
}

export interface RecognizedCard {
  cardId: string;
  confidence: number;
  orientation: Orientation;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface CardInSpread {
  position: number;
  positionMeaning: string;
  cardId: string;
  cardName: string;
  orientation: Orientation;
  meaning: string;
}

export interface SpreadDefinition {
  id: SpreadType;
  name: Record<string, string>;
  cardCount: number;
  positions: Array<{
    index: number;
    meaning: Record<string, string>;
  }>;
}
