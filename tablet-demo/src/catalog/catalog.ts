/**
 * Sample option catalog (demo content — NOT Minh Quang's final range).
 *
 * Everything the app knows about "what can be chosen" lives here, keyed by
 * stable IDs. Display text lives in src/content/{vi,en}.ts; drawings live in
 * src/sketches. To add an option: add its ID below, add copy in both content
 * files, and register a sketch (see README).
 */

export type ProductId = 'suit' | 'blazer' | 'trousers';
export type GarmentId = 'jacket' | 'trousers';

export const GROUPS = [
  // ── Jacket (shared by blazer and the jacket of a suit) ──────────────────
  {
    id: 'closure',
    garment: 'jacket',
    options: ['closure.sb1', 'closure.sb2', 'closure.db6x2'],
    preset: 'closure.sb2',
  },
  {
    id: 'lapel',
    garment: 'jacket',
    options: ['lapel.notch', 'lapel.peak'],
    preset: 'lapel.notch',
  },
  {
    id: 'shoulder',
    garment: 'jacket',
    options: ['shoulder.natural', 'shoulder.structured'],
    preset: 'shoulder.natural',
  },
  {
    id: 'hipPockets',
    garment: 'jacket',
    options: ['hipPockets.flap', 'hipPockets.jetted', 'hipPockets.patch'],
    preset: 'hipPockets.flap',
  },
  {
    id: 'vents',
    garment: 'jacket',
    options: ['vents.double', 'vents.single'],
    preset: 'vents.double',
  },
  {
    id: 'lining',
    garment: 'jacket',
    options: ['lining.full', 'lining.partial', 'lining.unlined'],
    preset: 'lining.full',
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

export interface GroupDef {
  id: GroupId;
  garment: GarmentId;
  options: readonly OptionId[];
  preset: OptionId;
}

export const GROUP_LIST: readonly GroupDef[] = GROUPS;

export const GROUP_BY_ID = Object.fromEntries(GROUP_LIST.map((g) => [g.id, g])) as Record<GroupId, GroupDef>;

export const PRODUCTS: Record<ProductId, { garments: readonly GarmentId[] }> = {
  suit: { garments: ['jacket', 'trousers'] },
  blazer: { garments: ['jacket'] },
  trousers: { garments: ['trousers'] },
};

export const PRODUCT_IDS: readonly ProductId[] = ['suit', 'blazer', 'trousers'];

export function groupsFor(garment: GarmentId): readonly GroupDef[] {
  return GROUP_LIST.filter((g) => g.garment === garment);
}

export interface Step {
  garment: GarmentId;
  group: GroupId;
}

/** Ordered list of every group that applies to the product. */
export function stepsFor(product: ProductId): Step[] {
  return PRODUCTS[product].garments.flatMap((garment) =>
    groupsFor(garment).map((g) => ({ garment, group: g.id })),
  );
}

export function groupOfOption(option: OptionId): GroupId {
  const found = GROUP_LIST.find((g) => g.options.includes(option));
  if (!found) throw new Error(`Unknown option ${option}`);
  return found.id;
}
