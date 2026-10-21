import type { Copy } from './copy';

/**
 * English copy. Neutral draft wording — awaiting house approval of
 * terminology and phrasing before live use.
 */
export const en: Copy = {
  brand: 'Minh Quang',
  brandSub: 'Tailoring house · Hanoi',
  demoBadge: 'Experience demo',
  language: { label: 'Language', vi: 'VI', en: 'EN' },
  newSession: 'New session',
  close: 'Close',

  products: {
    suit: { name: 'Two-piece suit', desc: 'One jacket and one pair of trousers, configured separately.' },
    blazer: { name: 'Blazer', desc: 'A tailored jacket, worn on its own with other trousers.' },
    trousers: { name: 'Trousers', desc: 'Made-to-order trousers, detail by detail.' },
  },

  garments: {
    suit: { jacket: 'Suit jacket', trousers: 'Suit trousers' },
    blazer: { jacket: 'Blazer', trousers: 'Trousers' },
    trousers: { jacket: 'Jacket', trousers: 'Trousers' },
  },

  groups: {
    closure: {
      name: 'Front closure',
      difference:
        'How the two fronts of the jacket close: single-breasted is slim and simple, double-breasted has wide fronts that overlap.',
      ask: 'Do you usually wear a jacket buttoned or open? Would you like a cleaner or a more formal look?',
      more: 'On a single-breasted jacket the fronts meet at the centre; the number of buttons (1 or 2) sets where the lapel folds. On a double-breasted 6×2 there are six buttons in two columns, usually only two are fastened; the fronts overlap and cover the chest more widely. This describes a design direction — the tailor will advise further at the measuring stage.',
      suggestion: 'The house sample chooses single-breasted 2 buttons: a balanced style that suits many occasions.',
    },
    lapel: {
      name: 'Lapel',
      difference:
        'The shape of the lapel: a notch lapel has a small V-shaped step between lapel and collar, a peak lapel points up towards the shoulder.',
      ask: 'Do you prefer a quieter lapel line or one that stands out more?',
      more: 'The notch lapel is the familiar choice on single-breasted jackets. The peak lapel rises to a point and is usually paired with double-breasted jackets. In this sample range, the double-breasted 6×2 is offered with peak lapels only.',
      suggestion: 'The house sample chooses the notch lapel, to go with the single-breasted jacket.',
    },
    shoulder: {
      name: 'Shoulder',
      difference:
        'How much padding and structure the shoulder has: natural follows your own shoulder softly, structured gives a more defined line.',
      ask: 'Do you prefer a soft, relaxed jacket or a clearer, firmer shoulder line?',
      more: 'A natural shoulder with light padding feels soft. A structured shoulder uses more padding to hold a straighter line. This is a design direction; the tailor will assess it in person when measuring.',
      suggestion: 'The house sample chooses the natural, lightly padded shoulder.',
      note: 'The drawing shows a design direction, not a jacket shaped to the customer.',
    },
    hipPockets: {
      name: 'Hip pockets',
      difference:
        'The style of the pockets on the jacket hips: with a flap over the opening, a neat jetted opening with no flap, or a patch sewn on the outside.',
      ask: 'Do you often use the jacket pockets? Would you like the jacket more formal or more relaxed?',
      more: 'Flap pocket: a cloth flap covers the opening and is easy to recognise. Jetted pocket: only a narrow welt is visible, very clean. Patch pocket: a piece of cloth stitched on the outside, a more relaxed look.',
      suggestion: 'The house sample chooses flap pockets.',
    },
    vents: {
      name: 'Back vents',
      difference: 'The slits in the back hem of the jacket: two vents at the sides, or one vent at the centre back.',
      ask: 'Do you sit a lot, or put your hands in your trouser pockets while wearing the jacket?',
      more: 'Double vents open at the two sides of the back; a single vent opens at the centre back. Vents let the jacket skirt move more freely when sitting or walking.',
      suggestion: 'The house sample chooses double vents.',
      note: 'The drawing shows the back of the jacket.',
    },
    lining: {
      name: 'Lining coverage',
      difference: 'How much of the jacket interior is lined: fully lined, partially lined or unlined.',
      ask: 'Which season will you wear it in mostly? Do you prefer a smooth, easy feel or a lighter, airier one?',
      more: 'A full lining covers the whole interior of the body and sleeves. A partial lining covers only part of it. Unlined is lighter. This option only chooses lining coverage — it says nothing about the canvas (interlining) construction.',
      suggestion: 'The house sample chooses a full lining.',
      note: 'The diagram shows lining coverage only, not the canvas construction.',
    },
    pleats: {
      name: 'Front pleats',
      difference: 'The folds at the front waist of the trousers: flat front (no pleats), one pleat or two pleats per side.',
      ask: 'Do you prefer a smooth flat front, or a little extra room at the hip with pleats?',
      more: 'A pleat is a fold of cloth just below the waistband. Do not confuse it with the pressed crease running down the middle of the leg; in the drawings the crease is shown as a dashed line to tell them apart.',
      suggestion: 'The house sample chooses flat front.',
    },
    waistband: {
      name: 'Waistband fastening details',
      difference:
        'How the waistband is finished: belt loops for a belt, or side adjusters to alter the waist width.',
      ask: 'Do you usually wear trousers with a belt, or would you like side adjusters?',
      more: 'Belt loops are small straps on the waistband for a belt. Side adjusters are two adjustment tabs at the sides of the waistband. The fit of the waist is decided by the tailor when measuring.',
      suggestion: 'The house sample chooses belt loops.',
    },
    frontPockets: {
      name: 'Front pockets',
      difference:
        'The direction of the pocket opening at the hip: slanted runs diagonally from the waistband down to the side seam, side-seam sits along the seam.',
      ask: 'Do you often use the front pockets? Do you prefer an opening that is easy to reach or a more discreet one?',
      more: 'A slanted pocket has its opening running diagonally from the waistband towards the side seam. A side-seam pocket has its opening right along the side seam, which is more discreet.',
      suggestion: 'The house sample chooses slanted pockets.',
    },
    backPockets: {
      name: 'Back pockets',
      difference: 'The number of pockets at the back: one pocket on the right, or two pockets, one on each side.',
      ask: 'Do you usually carry a wallet in a back pocket?',
      more: 'One right pocket means the wearer’s right side. Two pockets has a pocket on both sides of the back.',
      suggestion: 'The house sample chooses two pockets.',
      note: 'The drawing shows the back of the trousers.',
    },
    hem: {
      name: 'Hem',
      difference: 'The bottom of the trouser leg: a plain hem ends flat, a turn-up folds up into a cuff on the outside.',
      ask: 'Do you prefer a clean plain leg or a turn-up?',
      more: 'A turn-up (cuff) is cloth folded up at the bottom of the leg. The leg length is decided by the tailor when measuring.',
      suggestion: 'The house sample chooses a plain hem.',
    },
  },

  options: {
    'closure.sb1': { label: 'Single-breasted, 1 button', desc: 'One button at the waist, a long lapel roll, an open look.' },
    'closure.sb2': { label: 'Single-breasted, 2 buttons', desc: 'Two buttons at the waist, a familiar choice for suits and blazers.' },
    'closure.db6x2': {
      label: 'Double-breasted 6×2',
      desc: 'Six buttons in two columns, wide overlapping fronts. Offered with peak lapels only in this sample range.',
    },
    'lapel.notch': { label: 'Notch lapel', desc: 'A small V-shaped step between lapel and collar.' },
    'lapel.peak': { label: 'Peak lapel', desc: 'The lapel points up towards the shoulder, a sharper line.' },
    'shoulder.natural': { label: 'Natural, lightly padded', desc: 'A soft shoulder line that follows your own shoulder.' },
    'shoulder.structured': { label: 'Structured', desc: 'More padding, a straighter and more defined shoulder line.' },
    'hipPockets.flap': { label: 'Flap pockets', desc: 'A cloth flap covers the pocket opening.' },
    'hipPockets.jetted': { label: 'Jetted pockets', desc: 'Only a narrow welt marks the opening, no flap.' },
    'hipPockets.patch': { label: 'Patch pockets', desc: 'A piece of cloth stitched on the outside of the jacket.' },
    'vents.double': { label: 'Double vents', desc: 'Two slits, one at each side of the back.' },
    'vents.single': { label: 'Single vent', desc: 'One slit at the centre back.' },
    'lining.full': { label: 'Fully lined', desc: 'Lining covers the whole interior of the body and sleeves.' },
    'lining.partial': { label: 'Partially lined', desc: 'Lining over the upper back and sleeves; the rest has bound seams.' },
    'lining.unlined': { label: 'Unlined', desc: 'No lining; the inside seams are neatly bound.' },
    'pleats.flat': { label: 'Flat front', desc: 'A smooth front with no pleats.' },
    'pleats.one': { label: 'One pleat per side', desc: 'One pleat below the waistband on each side.' },
    'pleats.two': { label: 'Two pleats per side', desc: 'Two pleats below the waistband on each side.' },
    'waistband.beltLoops': { label: 'Belt loops', desc: 'Small straps on the waistband for a belt.' },
    'waistband.sideAdjusters': { label: 'Side adjusters', desc: 'Two tabs at the sides of the waistband to adjust the width.' },
    'frontPockets.slanted': { label: 'Slanted pockets', desc: 'The opening runs diagonally from the waistband to the side seam.' },
    'frontPockets.sideSeam': { label: 'Side-seam pockets', desc: 'The opening sits along the side seam of the trousers.' },
    'backPockets.oneRight': { label: 'One right pocket', desc: 'One back pocket, on the wearer’s right.' },
    'backPockets.two': { label: 'Two pockets', desc: 'One back pocket on each side.' },
    'hem.plain': { label: 'Plain hem', desc: 'The leg ends flat.' },
    'hem.turnUp': { label: 'Turn-up', desc: 'The bottom of the leg is folded up into an outer cuff.' },
  },

  start: {
    title: 'Choose your style together with the tailor',
    intro: 'See each detail as a drawing, compare, and agree on the design before moving on to measuring.',
    productsLabel: 'Choose a product',
    modeLabel: 'How to start',
    modeManual: { title: 'Choose each detail', desc: 'Go through every group in turn, with nothing chosen in advance.' },
    modePreset: {
      title: 'Start with the house suggestion',
      desc: 'Fills in a sample configuration that you can then change detail by detail.',
    },
    cta: 'Start consultation',
    needProduct: 'Choose a product to begin.',
  },

  configure: {
    stepsLabel: 'Detail groups',
    garmentsLabel: 'Choose a garment',
    groupOf: 'Group {n} of {total}',
    back: 'Back',
    next: 'Continue',
    toReview: 'Review design',
    doneBackToReview: 'Done, back to review',
    askHouse: 'Ask for a house suggestion',
    learnMore: 'Learn more',
    hideMore: 'Show less',
    askLabel: 'Question for staff to ask',
    moreLabel: 'Further explanation',
    selected: 'Selected',
    notSelected: 'Not chosen',
    enlarge: 'Enlarge drawing: {label}',
    optionsOf: 'Options: {group}',
    unavailable: 'Not offered in the sample range',
    changeClosure: 'Change front closure',
    stepDone: 'chosen',
    stepTodo: 'not chosen',
    summaryTitle: 'Selection summary',
    summaryToggle: 'Summary ({done}/{total})',
    progress: '{done} of {total} groups chosen',
    allDone: 'Every group is chosen',
    openReview: 'Review design',
    jumpTo: 'Go to: {group}',
  },

  suggestion: {
    title: 'House suggestion',
    houseLabel: 'Sample suggestion',
    disclaimer:
      'This is a sample suggestion, not based on the customer’s build or needs. It only counts as a choice once you press “Apply”.',
    apply: 'Apply this option',
    applied: 'Currently selected',
    decline: 'I’ll choose myself',
    unavailable: 'This suggestion is not available with the current selection.',
  },

  lapelRule: {
    title: 'Double-breasted 6×2 comes with peak lapels',
    body: 'In this sample range, the double-breasted 6×2 is offered with peak lapels only. If you agree, the front closure changes to double-breasted 6×2 and the lapel changes from notch to peak.',
    accept: 'Agree, change both',
    cancel: 'Cancel, keep as is',
    disabledReason: 'The sample range has only peak lapels for the double-breasted 6×2.',
  },

  review: {
    title: 'Review the design',
    intro: 'Check each detail together. Tap “Edit” to change one group without losing the others.',
    missingTitle: '{n} group(s) still to choose',
    missingIntro: 'Tap a group name to choose it now:',
    chooseNow: 'Choose now',
    edit: 'Edit',
    editLabel: 'Edit: {group}',
    notChosen: 'Not chosen',
    confirm: 'Confirm design',
    confirmBlocked: 'Choose the missing groups before confirming.',
    confirmUnchanged: 'No changes since the confirmed version.',
    backToEdit: 'Back to choosing',
    editingBanner: 'Editing. The confirmed version (no. {n}) stays unchanged until you confirm again.',
    viewConfirmed: 'View confirmed version',
  },

  confirmed: {
    title: 'Sample design confirmed',
    subtitle: 'This is a demo design sheet, not an order.',
    codeLabel: 'Demo code',
    revision: 'Confirmation no. {n}',
    confirmedAt: 'Confirmed at {time} (within this demo session)',
    nextTitle: 'Next step',
    nextBody: 'The customer moves to the measuring area. The tailor measures, and staff complete the order together with the customer.',
    edit: 'Edit design',
    newSession: 'Start new session',
    changed: 'Changed',
    wasValue: 'Before: {value}',
    changesTitle: 'Changes since no. {n}',
    firstRevisionNote: 'If you edit and confirm again, the details that changed will be marked here.',
  },

  reset: {
    title: 'Start a new session?',
    body: 'The current selections and the confirmed version in this session will be cleared.',
    confirm: 'Clear and start over',
    cancel: 'Keep this session',
  },
};
