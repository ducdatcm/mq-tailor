import type { GarmentId, GroupId, OptionId, ProductId } from '../catalog/catalog';
import type { Selections } from '../catalog/rules';

export type Lang = 'vi' | 'en';
export type Screen = 'start' | 'configure' | 'review' | 'confirmed';
export type StartMode = 'manual' | 'preset';

export interface Cursor {
  garment: GarmentId;
  group: GroupId;
}

/** A change that needs the user's explicit OK before it touches the draft. */
export interface PendingChange {
  reason: 'lapelToPeak';
  garment: GarmentId;
  group: GroupId;
  option: OptionId;
  /** The full selection set that will replace the draft if accepted. */
  next: Selections;
}

/** What was agreed on screen. Kept separate from the editable draft. */
export interface Snapshot {
  /** Demo label only — not a production order/receipt number. */
  code: string;
  revision: number;
  confirmedAt: number;
  product: ProductId;
  selections: Selections;
  /** Selections of the previous revision, to highlight what changed. */
  previousSelections: Selections | null;
}

export interface State {
  lang: Lang;
  screen: Screen;
  /** Start-screen choices, before a session exists. */
  startProduct: ProductId | null;
  startMode: StartMode;
  /** Session draft. */
  product: ProductId | null;
  selections: Selections;
  cursor: Cursor;
  /** Last group visited on each garment, so switching jacket/trousers returns where you left off. */
  lastGroup: Record<GarmentId, GroupId>;
  returnToReview: boolean;
  pending: PendingChange | null;
  /** Last confirmed snapshot; untouched while the draft is edited. */
  confirmed: Snapshot | null;
}

export type Action =
  | { type: 'setLang'; lang: Lang }
  | { type: 'chooseProduct'; product: ProductId }
  | { type: 'chooseMode'; mode: StartMode }
  | { type: 'start' }
  | { type: 'select'; garment: GarmentId; group: GroupId; option: OptionId }
  | { type: 'acceptPending' }
  | { type: 'cancelPending' }
  | { type: 'goTo'; garment: GarmentId; group: GroupId }
  | { type: 'switchGarment'; garment: GarmentId }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'openReview' }
  | { type: 'editFromReview'; garment: GarmentId; group: GroupId }
  | { type: 'backToReview' }
  | { type: 'confirm'; at: number }
  | { type: 'editConfirmed' }
  | { type: 'viewConfirmed' }
  | { type: 'reset' };
