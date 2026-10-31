import {
  GROUP_BY_ID,
  groupsFor,
  type GarmentSelections,
  type GroupId,
  type OptionId,
  type Step,
  type Unit,
} from './catalog';

export type { GarmentSelections };
/** What is chosen on each unit of the order, by unit id ('jacket1', 'trousers2', 'trims'...). */
export type Selections = Record<string, GarmentSelections>;

export const emptySelections = (units: readonly Unit[] = []): Selections => Object.fromEntries(units.map((u) => [u.id, {}]));

export function cloneSelections(s: Selections): Selections {
  return Object.fromEntries(Object.entries(s).map(([id, chosen]) => [id, { ...chosen }]));
}

/** The one-click "house starting suggestion" for every unit. */
export function presetSelections(units: readonly Unit[]): Selections {
  const out = emptySelections(units);
  for (const unit of units) {
    for (const g of groupsFor(unit.garment)) out[unit.id][g.id] = g.preset;
  }
  return out;
}

/** Keep only the units of the order, and on each the groups that apply (what we snapshot). */
export function relevantSelections(units: readonly Unit[], s: Selections): Selections {
  const out = emptySelections(units);
  for (const unit of units) {
    const chosen = s[unit.id] ?? {};
    for (const g of groupsFor(unit.garment, chosen)) {
      if (chosen[g.id]) out[unit.id][g.id] = chosen[g.id];
    }
  }
  return out;
}

export function missingSteps(units: readonly Unit[], s: Selections): Step[] {
  const missing: Step[] = [];
  for (const unit of units) {
    const chosen = s[unit.id] ?? {};
    for (const g of groupsFor(unit.garment, chosen)) {
      if (!chosen[g.id]) missing.push({ unit: unit.id, group: g.id });
    }
  }
  return missing;
}

/** Compares what applies to each design: a group left out of one of them counts as unchosen there. */
export function selectionsEqual(units: readonly Unit[], a: Selections, b: Selections): boolean {
  for (const unit of units) {
    const left = a[unit.id] ?? {};
    const right = b[unit.id] ?? {};
    const inA = groupsFor(unit.garment, left);
    const inB = groupsFor(unit.garment, right);
    for (const g of groupsFor(unit.garment)) {
      if ((inA.includes(g) ? left[g.id] : undefined) !== (inB.includes(g) ? right[g.id] : undefined)) return false;
    }
  }
  return true;
}

export function countUnit(unit: Unit, s: Selections): { done: number; total: number } {
  const chosen = s[unit.id] ?? {};
  const groups = groupsFor(unit.garment, chosen);
  return { done: groups.filter((g) => chosen[g.id]).length, total: groups.length };
}

export function countSelected(units: readonly Unit[], s: Selections): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const unit of units) {
    const c = countUnit(unit, s);
    done += c.done;
    total += c.total;
  }
  return { done, total };
}

export function hasAnySelection(s: Selections): boolean {
  return Object.values(s).some((chosen) => Object.keys(chosen).length > 0);
}

// ── Demo rules ─────────────────────────────────────────────────────────────
// Sample range only: the double-breasted closures are offered with peak lapels.
// This is a demo scope choice, not a claim that other combinations cannot be tailored.

export const DOUBLE_BREASTED: readonly OptionId[] = ['closure.db6x2', 'closure.db6x1', 'closure.db4x2', 'closure.db4x1'];
export const isDoubleBreasted = (option: OptionId | undefined): boolean => option !== undefined && DOUBLE_BREASTED.includes(option);

export type DisabledReason = 'dbNeedsPeak';

export function disabledReason(s: Selections, unit: Unit, group: GroupId, option: OptionId): DisabledReason | null {
  if (
    unit.garment === 'jacket' &&
    group === 'lapel' &&
    (option === 'lapel.notch' || option === 'lapel.shawl') &&
    isDoubleBreasted(s[unit.id]?.closure)
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
export function resolveSelection(s: Selections, unit: Unit, group: GroupId, option: OptionId): Resolution {
  if (GROUP_BY_ID[group].garment !== unit.garment || !GROUP_BY_ID[group].options.includes(option)) {
    return { kind: 'blocked', reason: 'invalid' };
  }
  const blocked = disabledReason(s, unit, group, option);
  if (blocked) return { kind: 'blocked', reason: blocked };

  const next = cloneSelections(s);
  next[unit.id] = { ...next[unit.id], [group]: option };

  if (
    unit.garment === 'jacket' &&
    group === 'closure' &&
    isDoubleBreasted(option) &&
    (s[unit.id]?.lapel === 'lapel.notch' || s[unit.id]?.lapel === 'lapel.shawl')
  ) {
    next[unit.id].lapel = 'lapel.peak';
    return { kind: 'confirm', reason: 'lapelToPeak', selections: next };
  }
  return { kind: 'apply', selections: next };
}

/**
 * A unit can copy an earlier unit of the same kind ("same as the trousers already chosen"): the ones
 * that copy follow what they copy. Walks the units in order, so a chain of copies stays in step.
 */
export function syncMirrors(units: readonly Unit[], sameAs: Readonly<Record<string, string | null>>, s: Selections): Selections {
  const out = cloneSelections(s);
  for (const unit of units) {
    const source = sameAs[unit.id];
    if (source && out[source]) out[unit.id] = { ...out[source] };
  }
  return out;
}

/** The earlier units of the same kind that a unit can copy. */
export function copyableUnits(units: readonly Unit[], unit: Unit): Unit[] {
  return units.filter((u) => u.garment === unit.garment && u.n < unit.n);
}
