import type { ComponentType } from 'react';
import type { OptionId, ProductId } from '../catalog/catalog';
import {
  ClosureDB,
  ClosureSB1,
  ClosureSB2,
  LapelNotch,
  LapelPeak,
  LiningFull,
  LiningNone,
  LiningPartial,
  PocketFlap,
  PocketJetted,
  PocketPatch,
  ShoulderNatural,
  ShoulderStructured,
  VentSingle,
  VentsDouble,
} from './jacket';
import { ProductBlazer, ProductSuit, ProductTrousers } from './products';
import {
  BackPocketOneRight,
  BackPocketsTwo,
  FrontPocketSideSeam,
  FrontPocketSlanted,
  HemPlain,
  HemTurnUp,
  PleatsFlat,
  PleatsOne,
  PleatsTwo,
  WaistbandAdjusters,
  WaistbandBeltLoops,
} from './trousers';

/** One drawing per option, keyed by the stable option ID. */
export const OPTION_SKETCHES: Record<OptionId, ComponentType> = {
  'closure.sb1': ClosureSB1,
  'closure.sb2': ClosureSB2,
  'closure.db6x2': ClosureDB,
  'lapel.notch': LapelNotch,
  'lapel.peak': LapelPeak,
  'shoulder.natural': ShoulderNatural,
  'shoulder.structured': ShoulderStructured,
  'hipPockets.flap': PocketFlap,
  'hipPockets.jetted': PocketJetted,
  'hipPockets.patch': PocketPatch,
  'vents.double': VentsDouble,
  'vents.single': VentSingle,
  'lining.full': LiningFull,
  'lining.partial': LiningPartial,
  'lining.unlined': LiningNone,
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
};

export const PRODUCT_SKETCHES: Record<ProductId, ComponentType> = {
  suit: ProductSuit,
  blazer: ProductBlazer,
  trousers: ProductTrousers,
};
