import type { GarmentId, GroupId, OptionId, ProductId } from '../catalog/catalog';
import type { Selections } from '../catalog/rules';

export type Lang = 'vi' | 'en';
export type Screen = 'start' | 'configure' | 'review' | 'order' | 'confirmed';
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
  revision: number;
  confirmedAt: number;
  product: ProductId;
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
  /** Three-piece suit with two trousers: the second pair follows the first ("same as the trousers already chosen"). */
  sameTrousers: boolean;
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
  | { type: 'chooseProduct'; product: ProductId }
  | { type: 'chooseMode'; mode: StartMode }
  | { type: 'start' }
  | { type: 'select'; garment: GarmentId; group: GroupId; option: OptionId }
  | { type: 'acceptPending' }
  | { type: 'cancelPending' }
  | { type: 'goTo'; garment: GarmentId; group: GroupId }
  | { type: 'switchGarment'; garment: GarmentId }
  | { type: 'setSameTrousers'; value: boolean }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'openReview' }
  | { type: 'editFromReview'; garment: GarmentId; group: GroupId }
  | { type: 'backToReview' }
  | { type: 'confirm'; at: number }
  | { type: 'setOrderField'; field: keyof OrderForm; value: string }
  | { type: 'confirmOrder'; at: number; submissionId: string }
  | { type: 'sheetResult'; status: SheetStatus }
  | { type: 'sheetRetry' }
  | { type: 'editConfirmed' }
  | { type: 'viewConfirmed' }
  | { type: 'reset' };
