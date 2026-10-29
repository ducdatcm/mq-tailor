import {
  GARMENT_IDS,
  GROUP_BY_ID,
  PRODUCTS,
  baseGarment,
  groupsFor,
  type GarmentId,
  type GroupId,
  type OptionId,
  type ProductId,
  type Step,
} from './catalog';

export type GarmentSelections = Partial<Record<GroupId, OptionId>>;
export type Selections = Record<GarmentId, GarmentSelections>;

export const emptySelections = (): Selections => ({ jacket: {}, waistcoat: {}, trousers: {}, trousers2: {}, trims: {} });

export function cloneSelections(s: Selections): Selections {
  const out = emptySelections();
  for (const garment of GARMENT_IDS) out[garment] = { ...s[garment] };
  return out;
}

/** The one-click "house starting suggestion" for a product. */
export function presetSelections(product: ProductId): Selections {
  const out = emptySelections();
  for (const garment of PRODUCTS[product].garments) {
    for (const g of groupsFor(garment)) out[garment][g.id] = g.preset;
  }
  return out;
}

/** Keep only the garments that belong to the product (what we snapshot). */
export function relevantSelections(product: ProductId, s: Selections): Selections {
  const out = emptySelections();
  for (const garment of PRODUCTS[product].garments) out[garment] = { ...s[garment] };
  return out;
}

export function missingSteps(product: ProductId, s: Selections): Step[] {
  const missing: Step[] = [];
  for (const garment of PRODUCTS[product].garments) {
    for (const g of groupsFor(garment)) {
      if (!s[garment][g.id]) missing.push({ garment, group: g.id });
    }
  }
  return missing;
}

export function selectionsEqual(product: ProductId, a: Selections, b: Selections): boolean {
  for (const garment of PRODUCTS[product].garments) {
    for (const g of groupsFor(garment)) {
      if (a[garment][g.id] !== b[garment][g.id]) return false;
    }
  }
  return true;
}

export function countSelected(product: ProductId, s: Selections): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const garment of PRODUCTS[product].garments) {
    for (const g of groupsFor(garment)) {
      total += 1;
      if (s[garment][g.id]) done += 1;
    }
  }
  return { done, total };
}

export function countGarment(garment: GarmentId, s: Selections): { done: number; total: number } {
  const groups = groupsFor(garment);
  return { done: groups.filter((g) => s[garment][g.id]).length, total: groups.length };
}

export function hasAnySelection(s: Selections): boolean {
  return GARMENT_IDS.some((garment) => Object.keys(s[garment]).length > 0);
}

// ── Demo rules ─────────────────────────────────────────────────────────────
// Sample range only: the double-breasted closures are offered with peak lapels.
// This is a demo scope choice, not a claim that other combinations cannot be tailored.

export const DOUBLE_BREASTED: readonly OptionId[] = ['closure.db6x2', 'closure.db6x1', 'closure.db4x2', 'closure.db4x1'];
export const isDoubleBreasted = (option: OptionId | undefined): boolean => option !== undefined && DOUBLE_BREASTED.includes(option);

export type DisabledReason = 'dbNeedsPeak';

export function disabledReason(s: Selections, garment: GarmentId, group: GroupId, option: OptionId): DisabledReason | null {
  if (
    garment === 'jacket' &&
    group === 'lapel' &&
    (option === 'lapel.notch' || option === 'lapel.shawl') &&
    isDoubleBreasted(s.jacket.closure)
  ) {
    return 'dbNeedsPeak';
  }
  return null;
}

export type Resolution =
  | { kind: 'apply'; selections: Selections }
  | { kind: 'confirm'; reason: 'lapelToPeak'; selections: Selections }
  | { kind: 'blocked'; reason: DisabledReason | 'invalid' };

/**
 * Work out what choosing `option` means. Never mutates `s`, and never changes
 * another group without asking: a side effect comes back as `confirm` and is
 * only applied once the user accepts it.
 */
export function resolveSelection(s: Selections, garment: GarmentId, group: GroupId, option: OptionId): Resolution {
  if (GROUP_BY_ID[group].garment !== baseGarment(garment) || !GROUP_BY_ID[group].options.includes(option)) {
    return { kind: 'blocked', reason: 'invalid' };
  }
  const blocked = disabledReason(s, garment, group, option);
  if (blocked) return { kind: 'blocked', reason: blocked };

  const next = cloneSelections(s);
  next[garment][group] = option;

  if (
    garment === 'jacket' &&
    group === 'closure' &&
    isDoubleBreasted(option) &&
    (s.jacket.lapel === 'lapel.notch' || s.jacket.lapel === 'lapel.shawl')
  ) {
    next.jacket.lapel = 'lapel.peak';
    return { kind: 'confirm', reason: 'lapelToPeak', selections: next };
  }
  return { kind: 'apply', selections: next };
}
