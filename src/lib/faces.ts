export type FaceEntry = {
  route: string;
  display_name: string;
  description: string;
  /** Canonical room title from the seed doc — the single source of truth for
   *  door labels and future room pages, independent of whether the room is
   *  carved yet. */
  title: string;
  /** One-line description of the room, shown on the Hall's door cards. */
  tagline: string;
};

export const FACE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type FaceNumber = (typeof FACE_NUMBERS)[number];

/** Roman numerals for each face, so cards can show numerals without deriving. */
export const ROMAN: Record<FaceNumber, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
  10: 'X',
  11: 'XI',
  12: 'XII'
};

// An uncarved face keeps its honest "not yet carved" copy on the `[n]` page,
// but still carries its canonical title/tagline for the Hall's doors.
const uncarved = (n: FaceNumber, title: string, tagline: string): FaceEntry => ({
  route: `/faces/${n}`,
  display_name: `Face ${ROMAN[n]}`,
  description: 'This face has not yet been carved.',
  title,
  tagline
});

export const FACES: Record<FaceNumber, FaceEntry> = {
  1: uncarved(1, 'The Orrery of Working Parts', 'A brass planetarium where the swarm itself turns.'),
  2: uncarved(2, "The Luthier's Grotto", 'A cave where guitars grow like stalactites.'),
  3: {
    route: '/faces/3',
    display_name: 'The Library of Unfinished Books',
    description: 'Shelves for everything honestly abandoned.',
    title: 'The Library of Unfinished Books',
    tagline: 'Shelves for everything honestly abandoned.'
  },
  4: uncarved(4, 'The Tidepool Observatory', 'A shallow pool that remembers every visitor.'),
  5: uncarved(
    5,
    'The Clockwork Aviary',
    'Origami birds that flock, each carrying one true sentence.'
  ),
  6: uncarved(
    6,
    'The Vault of Sound Money',
    "Where the swarm's economy is engraved in rolling coins."
  ),
  7: {
    route: '/faces/7',
    display_name: "The Cartographer's Attic",
    description: 'Self-refining charts of places that do not exist yet.',
    title: "The Cartographer's Attic",
    tagline: 'Hand-drawn maps of territories that do not exist yet.'
  },
  8: uncarved(8, 'The Echo Canyon', 'A canyon that answers you in harmony.'),
  9: uncarved(
    9,
    'The Greenhouse of Compiling Ideas',
    'A glasshouse where projects grow in real time.'
  ),
  10: uncarved(
    10,
    'The Night Market of Small Wonders',
    'Lantern-lit stalls, each selling one interactive toy for free.'
  ),
  11: uncarved(
    11,
    'The Lighthouse at the Edge of the Map',
    'The room at the top, where all the signals come in.'
  ),
  12: uncarved(
    12,
    'The Hall of Twelve Doors',
    "The room the die lives in when it isn't in your hand."
  )
};

export function isFaceNumber(n: number): n is FaceNumber {
  return Number.isInteger(n) && n >= 1 && n <= 12;
}
