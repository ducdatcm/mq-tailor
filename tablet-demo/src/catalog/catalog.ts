/**
 * Sample option catalog (demo content — NOT Minh Quang's final range).
 *
 * Everything the app knows about "what can be chosen" lives here, keyed by
 * stable IDs. Display text lives in src/content/{vi,en}.ts; drawings live in
 * src/sketches. To add an option: add its ID below, add copy in both content
 * files, and register a sketch (see README).
 */

export type ProductId = 'suit' | 'suit3Trousers' | 'suit3Waistcoat' | 'blazer' | 'trousers' | 'waistcoat' | 'shirt';
/** A kind of piece with its own set of option groups. */
export type PieceKind = 'jacket' | 'trousers' | 'waistcoat' | 'shirt';
/** The pieces, and 'trims' (the buttons and buttonholes, chosen once for the whole order: not a piece). */
export type BaseGarmentId = PieceKind | 'trims';
export type GarmentId = BaseGarmentId;

/** How many of one product an order can hold. 0 means the product is not in the order. */
export const MIN_QUANTITY = 0;
export const MAX_QUANTITY = 99;

/** What the order holds: how many of each product. */
export type Quantities = Partial<Record<ProductId, number>>;

/**
 * One piece to design. A unit is one jacket, one pair of trousers, one shirt...: an order of
 * 1 suit and 2 pairs of trousers has three units of trousers. `n` counts the units of the same kind
 * through the whole order (trousers 1, 2, 3), which is also how the sale talks about them.
 */
export interface Unit {
  /** Stable name: the kind and its number, like 'trousers2'; the trims are 'trims'. */
  id: string;
  garment: BaseGarmentId;
  n: number;
  /** The product this unit belongs to, and which of that product (1 = the first suit...). */
  product?: ProductId;
  copy: number;
}

export const GROUPS = [
  // ── Jacket (shared by blazer and the jacket of a suit) ──────────────────
  {
    id: 'closure',
    garment: 'jacket',
    options: [
      'closure.sb1',
      'closure.sb2',
      'closure.sb3',
      'closure.db6x2',
      'closure.db6x1',
      'closure.db4x2',
      'closure.db4x1',
    ],
    /** Options are shown in two families so the cards stay comparable. */
    families: [
      { id: 'single', options: ['closure.sb1', 'closure.sb2', 'closure.sb3'] },
      { id: 'double', options: ['closure.db6x2', 'closure.db6x1', 'closure.db4x2', 'closure.db4x1'] },
    ],
    preset: 'closure.sb2',
  },
  {
    id: 'lapel',
    garment: 'jacket',
    options: ['lapel.notch', 'lapel.peak', 'lapel.shawl'],
    preset: 'lapel.notch',
  },
  {
    id: 'shoulder',
    garment: 'jacket',
    options: ['shoulder.roped', 'shoulder.natural', 'shoulder.camicia'],
    preset: 'shoulder.natural',
  },
  {
    id: 'hipPockets',
    garment: 'jacket',
    options: [
      'hipPockets.slantedFlap',
      'hipPockets.slantedJet',
      'hipPockets.patch',
      'hipPockets.straightFlap',
      'hipPockets.straightJet',
    ],
    preset: 'hipPockets.straightFlap',
  },
  {
    id: 'breastPocket',
    garment: 'jacket',
    options: ['breastPocket.straight', 'breastPocket.barchetta', 'breastPocket.patch'],
    preset: 'breastPocket.barchetta',
  },
  {
    id: 'vents',
    garment: 'jacket',
    options: ['vents.none', 'vents.single', 'vents.double'],
    preset: 'vents.double',
  },
  {
    id: 'cuffs',
    garment: 'jacket',
    options: ['cuffs.1', 'cuffs.2', 'cuffs.3', 'cuffs.4'],
    preset: 'cuffs.4',
  },
  {
    // Chosen on the cuffs screen, for all four cuffs options at once.
    id: 'cuffMode',
    garment: 'jacket',
    companionOf: 'cuffs',
    noSketch: true,
    options: ['cuffMode.functional', 'cuffMode.closed'],
    preset: 'cuffMode.closed',
  },
  {
    id: 'lining',
    garment: 'jacket',
    options: ['lining.full', 'lining.half', 'lining.quarter', 'lining.unlined'],
    preset: 'lining.full',
  },
  // ── Waistcoat (standalone, or the third piece of a suit) ────────────────
  {
    id: 'waistcoatStyle',
    garment: 'waistcoat',
    options: ['waistcoat.sb2', 'waistcoat.sb4', 'waistcoat.db2', 'waistcoat.db4'],
    preset: 'waistcoat.sb2',
  },
  // ── Shirt ─────────────────────────────────────────────────────────────────
  {
    id: 'sleeve',
    garment: 'shirt',
    noSketch: true,
    options: ['sleeve.long', 'sleeve.short'],
    preset: 'sleeve.long',
  },
  {
    id: 'collar',
    garment: 'shirt',
    noSketch: true,
    options: [
      'collar.standardSquare',
      'collar.pintuck',
      'collar.buttonDown',
      'collar.windsor',
      'collar.eton',
      'collar.winged',
      'collar.stand',
      'collar.cuban',
    ],
    preset: 'collar.standardSquare',
  },
  {
    id: 'chestPocket',
    garment: 'shirt',
    options: ['chestPocket.none', 'chestPocket.angled', 'chestPocket.rounded', 'chestPocket.square', 'chestPocket.flap'],
    preset: 'chestPocket.none',
  },
  {
    id: 'placket',
    garment: 'shirt',
    noSketch: true,
    options: ['placket.frenchFront', 'placket.coveredFly', 'placket.pleatedTuxedo', 'placket.frontPlacket'],
    preset: 'placket.frenchFront',
  },
  {
    // A short sleeve has no cuff: this group is left out once short sleeves are chosen.
    id: 'shirtCuffs',
    garment: 'shirt',
    noSketch: true,
    hideWhen: { group: 'sleeve', option: 'sleeve.short' },
    options: [
      'shirtCuffs.angled',
      'shirtCuffs.rounded',
      'shirtCuffs.square',
      'shirtCuffs.french',
      'shirtCuffs.roundedFrench',
      'shirtCuffs.doubleFrench',
      'shirtCuffs.doubleRoundedFrench',
    ],
    preset: 'shirtCuffs.angled',
  },
  {
    id: 'shirtHem',
    garment: 'shirt',
    noSketch: true,
    options: ['shirtHem.sideVents', 'shirtHem.gusset'],
    preset: 'shirtHem.sideVents',
  },
  // ── Trims: buttons and buttonholes, one choice for the whole order (no drawings) ──
  {
    id: 'buttonType',
    garment: 'trims',
    noSketch: true,
    options: ['buttonType.plastic', 'buttonType.horn', 'buttonType.motherOfPearl'],
    preset: 'buttonType.plastic',
  },
  {
    id: 'milanese',
    garment: 'trims',
    noSketch: true,
    options: ['milanese.yes', 'milanese.no'],
    preset: 'milanese.no',
  },
  // ── Trousers (shared by standalone trousers and suit trousers) ──────────
  {
    id: 'pleats',
    garment: 'trousers',
    options: ['pleats.flat', 'pleats.one', 'pleats.two'],
    preset: 'pleats.flat',
  },
  {
    id: 'waistband',
    garment: 'trousers',
    options: ['waistband.beltLoops', 'waistband.sideAdjusters'],
    preset: 'waistband.beltLoops',
  },
  {
    id: 'frontPockets',
    garment: 'trousers',
    options: ['frontPockets.slanted', 'frontPockets.sideSeam'],
    preset: 'frontPockets.slanted',
  },
  {
    id: 'backPockets',
    garment: 'trousers',
    options: ['backPockets.oneRight', 'backPockets.two'],
    preset: 'backPockets.two',
  },
  {
    id: 'hem',
    garment: 'trousers',
    options: ['hem.plain', 'hem.turnUp'],
    preset: 'hem.plain',
  },
] as const;

export type GroupId = (typeof GROUPS)[number]['id'];
export type OptionId = (typeof GROUPS)[number]['options'][number];

export type FamilyId = 'single' | 'double';

/** What is chosen on one unit. */
export type GarmentSelections = Partial<Record<GroupId, OptionId>>;

export interface GroupDef {
  id: GroupId;
  garment: BaseGarmentId;
  options: readonly OptionId[];
  preset: OptionId;
  /** A group chosen on the screen of another group (it adds no step of its own). */
  companionOf?: GroupId;
  /** The options have no drawings: shown as text cards. */
  noSketch?: boolean;
  /** The group does not apply once this option of another group of the same garment is chosen. */
  hideWhen?: { group: GroupId; option: OptionId };
  /** Optional split of the options into labelled families (front closure only). */
  families?: readonly { id: FamilyId; options: readonly OptionId[] }[];
}

export const GROUP_LIST: readonly GroupDef[] = GROUPS;

export const GROUP_BY_ID = Object.fromEntries(GROUP_LIST.map((g) => [g.id, g])) as Record<GroupId, GroupDef>;

/** The pieces of each product, in the order they are designed (a three-piece suit has two pairs of trousers). */
export const PRODUCTS: Record<ProductId, { pieces: readonly PieceKind[] }> = {
  suit: { pieces: ['jacket', 'trousers'] },
  suit3Trousers: { pieces: ['jacket', 'trousers', 'trousers'] },
  suit3Waistcoat: { pieces: ['jacket', 'waistcoat', 'trousers'] },
  blazer: { pieces: ['jacket'] },
  trousers: { pieces: ['trousers'] },
  waistcoat: { pieces: ['waistcoat'] },
  shirt: { pieces: ['shirt'] },
};

/** Every product the order logic knows. */
export const ALL_PRODUCT_IDS: readonly ProductId[] = ['suit', 'suit3Trousers', 'suit3Waistcoat', 'blazer', 'trousers', 'waistcoat', 'shirt'];

/**
 * The products offered on the start screen. The shirt is built (catalog, copy, sheet columns) but
 * switched off for now: add 'shirt' back here to offer it again.
 */
export const PRODUCT_IDS: readonly ProductId[] = ['suit', 'suit3Trousers', 'suit3Waistcoat', 'blazer', 'trousers', 'waistcoat'];

export const TRIMS_UNIT: Unit = { id: 'trims', garment: 'trims', n: 1, copy: 1 };

/** How many products the order holds in all. */
export const totalQuantity = (q: Quantities): number => ALL_PRODUCT_IDS.reduce((sum, p) => sum + (q[p] ?? 0), 0);

/**
 * Every piece the order needs designed, in order, with the trims last. Pieces of the same kind are
 * numbered through the whole order: 1 suit and 2 trousers gives trousers 1 (in the suit), 2 and 3.
 */
export function unitsFor(q: Quantities): Unit[] {
  const units: Unit[] = [];
  const counts: Partial<Record<PieceKind, number>> = {};
  for (const product of ALL_PRODUCT_IDS) {
    for (let copy = 1; copy <= (q[product] ?? 0); copy += 1) {
      for (const garment of PRODUCTS[product].pieces) {
        const n = (counts[garment] ?? 0) + 1;
        counts[garment] = n;
        units.push({ id: `${garment}${n}`, garment, n, product, copy });
      }
    }
  }
  return units.length > 0 ? [...units, TRIMS_UNIT] : [];
}

/** False when an option chosen on the same unit takes this group out of the design. */
export function isGroupShown(group: GroupDef, chosen?: GarmentSelections): boolean {
  return !group.hideWhen || chosen?.[group.hideWhen.group] !== group.hideWhen.option;
}

/**
 * The groups of a kind of piece. Pass what is chosen on the unit so far to leave out the groups that do
 * not apply (a short-sleeved shirt has no cuffs); without it every group of the kind is returned.
 */
export function groupsFor(garment: BaseGarmentId, chosen?: GarmentSelections): readonly GroupDef[] {
  return GROUP_LIST.filter((g) => g.garment === garment && (!chosen || isGroupShown(g, chosen)));
}

export interface Step {
  unit: string;
  group: GroupId;
}

/** Ordered list of every group that applies to the units (see groupsFor for how `chosen` is used). */
export function stepsFor(units: readonly Unit[], chosen?: Readonly<Record<string, GarmentSelections>>): Step[] {
  return units.flatMap((unit) =>
    groupsFor(unit.garment, chosen?.[unit.id])
      .filter((g) => !g.companionOf)
      .map((g) => ({ unit: unit.id, group: g.id })),
  );
}

export function groupOfOption(option: OptionId): GroupId {
  const found = GROUP_LIST.find((g) => g.options.includes(option));
  if (!found) throw new Error(`Unknown option ${option}`);
  return found.id;
}
