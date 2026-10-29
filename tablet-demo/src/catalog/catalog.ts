/**
 * Sample option catalog (demo content — NOT Minh Quang's final range).
 *
 * Everything the app knows about "what can be chosen" lives here, keyed by
 * stable IDs. Display text lives in src/content/{vi,en}.ts; drawings live in
 * src/sketches. To add an option: add its ID below, add copy in both content
 * files, and register a sketch (see README).
 */

export type ProductId = 'suit' | 'suit3Trousers' | 'suit3Waistcoat' | 'blazer' | 'trousers' | 'waistcoat';
/** A garment with its own set of option groups ('trims' is not a garment: the buttons and buttonholes, chosen once for the whole order). */
export type BaseGarmentId = 'jacket' | 'trousers' | 'waistcoat' | 'trims';
/** A garment as it appears in a product: 'trousers2' is the second pair of a three-piece, same groups as 'trousers'. */
export type GarmentId = BaseGarmentId | 'trousers2';

export const GARMENT_IDS: readonly GarmentId[] = ['jacket', 'waistcoat', 'trousers', 'trousers2', 'trims'];

/** The garment whose option groups apply (the second trousers use the trousers groups). */
export const baseGarment = (garment: GarmentId): BaseGarmentId => (garment === 'trousers2' ? 'trousers' : garment);

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

export interface GroupDef {
  id: GroupId;
  garment: BaseGarmentId;
  options: readonly OptionId[];
  preset: OptionId;
  /** A group chosen on the screen of another group (it adds no step of its own). */
  companionOf?: GroupId;
  /** The options have no drawings: shown as text cards. */
  noSketch?: boolean;
  /** Optional split of the options into labelled families (front closure only). */
  families?: readonly { id: FamilyId; options: readonly OptionId[] }[];
}

export const GROUP_LIST: readonly GroupDef[] = GROUPS;

export const GROUP_BY_ID = Object.fromEntries(GROUP_LIST.map((g) => [g.id, g])) as Record<GroupId, GroupDef>;

export const PRODUCTS: Record<ProductId, { garments: readonly GarmentId[] }> = {
  suit: { garments: ['jacket', 'trousers', 'trims'] },
  suit3Trousers: { garments: ['jacket', 'trousers', 'trousers2', 'trims'] },
  suit3Waistcoat: { garments: ['jacket', 'waistcoat', 'trousers', 'trims'] },
  blazer: { garments: ['jacket', 'trims'] },
  trousers: { garments: ['trousers', 'trims'] },
  waistcoat: { garments: ['waistcoat', 'trims'] },
};

export const PRODUCT_IDS: readonly ProductId[] = ['suit', 'suit3Trousers', 'suit3Waistcoat', 'blazer', 'trousers', 'waistcoat'];

export function groupsFor(garment: GarmentId): readonly GroupDef[] {
  const base = baseGarment(garment);
  return GROUP_LIST.filter((g) => g.garment === base);
}

export interface Step {
  garment: GarmentId;
  group: GroupId;
}

/** Ordered list of every group that applies to the product. */
export function stepsFor(product: ProductId): Step[] {
  return PRODUCTS[product].garments.flatMap((garment) =>
    groupsFor(garment)
      .filter((g) => !g.companionOf)
      .map((g) => ({ garment, group: g.id })),
  );
}

export function groupOfOption(option: OptionId): GroupId {
  const found = GROUP_LIST.find((g) => g.options.includes(option));
  if (!found) throw new Error(`Unknown option ${option}`);
  return found.id;
}
