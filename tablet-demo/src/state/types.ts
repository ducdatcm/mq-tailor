import type { GroupId, OptionId, ProductId, Quantities, Unit } from '../catalog/catalog';
import type { Selections } from '../catalog/rules';

export type Lang = 'vi' | 'en';
export type Screen = 'start' | 'configure' | 'review' | 'order' | 'confirmed';
export type StartMode = 'manual' | 'preset';

export interface Cursor {
  /** The unit being designed ('jacket1', 'trousers2'...). */
  unit: string;
  group: GroupId;
}

/** A change that needs the user's explicit OK before it touches the draft. */
export interface PendingChange {
  reason: 'lapelToPeak';
  unit: string;
  group: GroupId;
  option: OptionId;
  /** The full selection set that will replace the draft if accepted. */
  next: Selections;
}

/** What was agreed on screen. Kept separate from the editable draft. */
export interface Snapshot {
  revision: number;
  confirmedAt: number;
  /** How many of each product the order holds. */
  quantities: Quantities;
  /** The pieces that were designed, in order, with the trims last. */
  units: Unit[];
  selections: Selections;
  /** Selections of the previous revision, to highlight what changed. */
  previousSelections: Selections | null;
}

/** What the sale and the customer type on the order screen. */
export interface OrderForm {
  orderId: string;
  customerName: string;
  phone: string;
}

/** An order confirmed on the order screen, for one revision of the design. */
export interface OrderRecord extends OrderForm {
  /** Which confirmed design revision this order is for. */
  revision: number;
  confirmedAt: number;
  /** Lets the spreadsheet recognise a repeated delivery of the same order. */
  submissionId: string;
}

/** Whether the order row has reached the shared spreadsheet. */
export type SheetStatus = 'idle' | 'sending' | 'sent' | 'queued' | 'unconfigured';

export interface State {
  lang: Lang;
  screen: Screen;
  /** Start screen: how many of each product are in the order (a product at 0 or missing is not in it). */
  quantities: Quantities;
  startMode: StartMode;
  /** Session: every piece the order needs designed (empty until the session starts). */
  units: Unit[];
  /** Session draft, by unit. */
  selections: Selections;
  cursor: Cursor;
  /** Last group visited on each unit, so switching units returns where you left off. */
  lastGroup: Record<string, GroupId>;
  returnToReview: boolean;
  /** Units that copy an earlier unit of the same kind ("same as the trousers already chosen"). */
  sameAs: Record<string, string | null>;
  pending: PendingChange | null;
  /** Last confirmed snapshot; untouched while the draft is edited. */
  confirmed: Snapshot | null;
  /** Draft of the order screen. */
  order: OrderForm;
  /** The confirmed order for the current design revision, if any. */
  orderRecord: OrderRecord | null;
  sheet: SheetStatus;
}

export type Action =
  | { type: 'setLang'; lang: Lang }
  | { type: 'setQuantity'; product: ProductId; value: number }
  | { type: 'chooseMode'; mode: StartMode }
  | { type: 'start' }
  | { type: 'select'; unit: string; group: GroupId; option: OptionId }
  | { type: 'acceptPending' }
  | { type: 'cancelPending' }
  | { type: 'goTo'; unit: string; group: GroupId }
  | { type: 'switchUnit'; unit: string }
  | { type: 'setSameAs'; unit: string; source: string | null }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'openReview' }
  | { type: 'editFromReview'; unit: string; group: GroupId }
  | { type: 'backToReview' }
  | { type: 'confirm'; at: number }
  | { type: 'setOrderField'; field: keyof OrderForm; value: string }
  | { type: 'confirmOrder'; at: number; submissionId: string }
  | { type: 'sheetResult'; status: SheetStatus }
  | { type: 'sheetRetry' }
  | { type: 'editConfirmed' }
  | { type: 'viewConfirmed' }
  | { type: 'reset' };
