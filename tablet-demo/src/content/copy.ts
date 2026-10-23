import type { GarmentId, GroupId, OptionId, ProductId } from '../catalog/catalog';

export interface GroupCopy {
  /** Plain-language name shown as the heading. */
  name: string;
  /** Optional secondary tailoring term (shown in smaller type). */
  term?: string;
  /** One short sentence explaining the difference between the options. */
  difference: string;
  /** A question the salesperson can ask the customer. */
  ask: string;
  /** Optional longer explanation, shown only when expanded. */
  more: string;
  /** Why the house starting suggestion picks its option (neutral wording). */
  suggestion: string;
  /** Short note about what the illustration does / does not represent. */
  note?: string;
}

export interface OptionCopy {
  label: string;
  term?: string;
  desc: string;
}

export interface Copy {
  brand: string;
  brandSub: string;
  demoBadge: string;
  language: { label: string; vi: string; en: string };
  newSession: string;
  close: string;

  products: Record<ProductId, { name: string; desc: string }>;
  garments: Record<ProductId, Record<GarmentId, string>>;
  groups: Record<GroupId, GroupCopy>;
  options: Record<OptionId, OptionCopy>;

  start: {
    title: string;
    intro: string;
    productsLabel: string;
    modeLabel: string;
    modeManual: { title: string; desc: string };
    modePreset: { title: string; desc: string };
    cta: string;
    needProduct: string;
  };

  configure: {
    stepsLabel: string;
    garmentsLabel: string;
    groupOf: string; // {n} {total}
    back: string;
    next: string;
    toReview: string;
    doneBackToReview: string;
    askHouse: string;
    learnMore: string;
    hideMore: string;
    askLabel: string;
    moreLabel: string;
    selected: string;
    notSelected: string;
    enlarge: string; // {label}
    optionsOf: string; // {group}
    familiesLabel: string;
    familySingle: string;
    familyDouble: string;
    unavailable: string;
    changeClosure: string;
    stepDone: string;
    stepTodo: string;
    summaryTitle: string;
    summaryToggle: string; // {done} {total}
    progress: string; // {done} {total}
    allDone: string;
    openReview: string;
    jumpTo: string; // {group}
  };

  suggestion: {
    title: string;
    houseLabel: string;
    disclaimer: string;
    apply: string;
    applied: string;
    decline: string;
    unavailable: string;
  };

  lapelRule: {
    title: string;
    body: string;
    accept: string;
    cancel: string;
    disabledReason: string;
  };

  review: {
    title: string;
    intro: string;
    missingTitle: string; // {n}
    missingIntro: string;
    chooseNow: string;
    edit: string;
    editLabel: string; // {group}
    notChosen: string;
    confirm: string;
    confirmBlocked: string;
    confirmUnchanged: string;
    backToEdit: string;
    editingBanner: string; // {n}
    viewConfirmed: string;
  };

  confirmed: {
    title: string;
    subtitle: string;
    codeLabel: string;
    revision: string; // {n}
    confirmedAt: string; // {time}
    nextTitle: string;
    nextBody: string;
    edit: string;
    newSession: string;
    changed: string;
    wasValue: string; // {value}
    changesTitle: string; // {n}
    firstRevisionNote: string;
  };

  reset: {
    title: string;
    body: string;
    confirm: string;
    cancel: string;
  };
}

/** Replace {placeholders} in a copy string. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in vars ? String(vars[key]) : m));
}
