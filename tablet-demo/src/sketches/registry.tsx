import type { ComponentType } from 'react';
import { groupOfOption, type GarmentSelections, type GroupId, type OptionId, type ProductId } from '../catalog/catalog';
import {
  BreastPocketBarchetta,
  BreastPocketPatch,
  BreastPocketStraight,
  ClosureDB41,
  ClosureDB42,
  ClosureDB61,
  ClosureDB62,
  ClosureSB1,
  ClosureSB2,
  ClosureSB3,
  Cuffs1,
  Cuffs2,
  Cuffs3,
  Cuffs4,
  LapelNotch,
  LapelPeak,
  LapelShawl,
  LiningFull,
  LiningHalf,
  LiningNone,
  LiningQuarter,
  ShoulderCamicia,
  ShoulderNatural,
  ShoulderRoped,
  VentNone,
  VentSingle,
  VentsDouble,
  WaistbandAdjusters,
  WaistbandBeltLoops,
  WaistcoatDB2,
  WaistcoatDB4,
  WaistcoatSB2,
  WaistcoatSB4,
} from './photos';
import {
  FrontPocketSideSeam,
  FrontPocketSlanted,
  PocketPatch,
  PocketSlantedFlap,
  PocketSlantedJet,
  PocketStraightFlap,
  PocketStraightJet,
} from './pockets';
import { ProductBlazer, ProductSuit, ProductSuit3Trousers, ProductSuit3Waistcoat, ProductTrousers, ProductWaistcoat } from './products';
import {
  CollarBand,
  CollarButtonDown,
  CollarClub,
  CollarCuban,
  CollarCutaway,
  CollarCutawayTwoButton,
  CollarPoint,
  CollarSpread,
  CuffAngled,
  CuffRounded,
  HemRounded,
  HemStraight,
  PocketPointed,
  PocketRounded,
  PocketSquare,
  ProductShirt,
  SleeveLong,
  SleeveShort,
} from './shirt';
import { HemPlain, HemTurnUp } from './trousers';
import { BackPocketOneRight, BackPocketsTwo, PleatsFlat, PleatsOne, PleatsTwo } from './trouserViews';

/** What a drawing is told: the choices made so far on the same piece (some drawings follow another choice). */
export interface SketchProps {
  chosen?: GarmentSelections;
}

/** One drawing per option, keyed by the stable option ID. Options of a group marked noSketch have none. */
export const OPTION_SKETCHES: Partial<Record<OptionId, ComponentType<SketchProps>>> = {
  'closure.sb1': ClosureSB1,
  'closure.sb2': ClosureSB2,
  'closure.sb3': ClosureSB3,
  'closure.db6x2': ClosureDB62,
  'closure.db6x1': ClosureDB61,
  'closure.db4x2': ClosureDB42,
  'closure.db4x1': ClosureDB41,
  'lapel.notch': LapelNotch,
  'lapel.peak': LapelPeak,
  'lapel.shawl': LapelShawl,
  'shoulder.roped': ShoulderRoped,
  'shoulder.natural': ShoulderNatural,
  'shoulder.camicia': ShoulderCamicia,
  'hipPockets.slantedFlap': PocketSlantedFlap,
  'hipPockets.slantedJet': PocketSlantedJet,
  'hipPockets.patch': PocketPatch,
  'hipPockets.straightFlap': PocketStraightFlap,
  'hipPockets.straightJet': PocketStraightJet,
  'breastPocket.barchetta': BreastPocketBarchetta,
  'breastPocket.patch': BreastPocketPatch,
  'breastPocket.straight': BreastPocketStraight,
  'vents.none': VentNone,
  'vents.double': VentsDouble,
  'vents.single': VentSingle,
  'cuffs.1': Cuffs1,
  'cuffs.2': Cuffs2,
  'cuffs.3': Cuffs3,
  'cuffs.4': Cuffs4,
  'lining.full': LiningFull,
  'lining.half': LiningHalf,
  'lining.quarter': LiningQuarter,
  'lining.unlined': LiningNone,
  'waistcoat.sb2': WaistcoatSB2,
  'waistcoat.sb4': WaistcoatSB4,
  'waistcoat.db2': WaistcoatDB2,
  'waistcoat.db4': WaistcoatDB4,
  'pleats.flat': PleatsFlat,
  'pleats.one': PleatsOne,
  'pleats.two': PleatsTwo,
  'waistband.beltLoops': WaistbandBeltLoops,
  'waistband.sideAdjusters': WaistbandAdjusters,
  'frontPockets.slanted': FrontPocketSlanted,
  'frontPockets.sideSeam': FrontPocketSideSeam,
  'backPockets.oneRight': BackPocketOneRight,
  'backPockets.two': BackPocketsTwo,
  'hem.plain': HemPlain,
  'hem.turnUp': HemTurnUp,
  'sleeve.long': SleeveLong,
  'sleeve.short': SleeveShort,
  'collar.point': CollarPoint,
  'collar.spread': CollarSpread,
  'collar.cutaway': CollarCutaway,
  'collar.cutawayTwoButton': CollarCutawayTwoButton,
  'collar.buttonDown': CollarButtonDown,
  'collar.club': CollarClub,
  'collar.band': CollarBand,
  'collar.cuban': CollarCuban,
  'shirtCuffs.rounded': CuffRounded,
  'shirtCuffs.angled': CuffAngled,
  'chestPocket.rounded': PocketRounded,
  'chestPocket.pointed': PocketPointed,
  'chestPocket.square': PocketSquare,
  'shirtHem.straight': HemStraight,
  'shirtHem.rounded': HemRounded,
};

/** Groups whose drawings follow a choice made beside them: the cuffs show the double cuff, the pockets the flap. */
export const SKETCH_FOLLOWS: Partial<Record<GroupId, GroupId>> = {
  shirtCuffs: 'doubleCuff',
  chestPocket: 'pocketFlap',
};

/** Names the drawing of an option as it looks with these choices (the same name, the same picture). */
export function sketchKey(option: OptionId, chosen?: GarmentSelections): string {
  const follows = SKETCH_FOLLOWS[groupOfOption(option)];
  return follows ? `${option}|${chosen?.[follows] ?? ''}` : option;
}

export const PRODUCT_SKETCHES: Record<ProductId, ComponentType> = {
  suit: ProductSuit,
  suit3Trousers: ProductSuit3Trousers,
  suit3Waistcoat: ProductSuit3Waistcoat,
  blazer: ProductBlazer,
  trousers: ProductTrousers,
  waistcoat: ProductWaistcoat,
  shirt: ProductShirt,
};
