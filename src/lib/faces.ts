export type FaceEntry = {
  route: string;
  display_name: string;
  description: string;
};

export const FACE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type FaceNumber = (typeof FACE_NUMBERS)[number];

const uncarved = (n: FaceNumber, roman: string): FaceEntry => ({
  route: `/faces/${n}`,
  display_name: `Face ${roman}`,
  description: 'This face has not yet been carved.'
});

export const FACES: Record<FaceNumber, FaceEntry> = {
  1: uncarved(1, 'I'),
  2: uncarved(2, 'II'),
  3: {
    route: '/faces/3',
    display_name: 'The Library of Unfinished Books',
    description: 'Shelves for everything honestly abandoned.'
  },
  4: uncarved(4, 'IV'),
  5: uncarved(5, 'V'),
  6: uncarved(6, 'VI'),
  7: uncarved(7, 'VII'),
  8: uncarved(8, 'VIII'),
  9: uncarved(9, 'IX'),
  10: uncarved(10, 'X'),
  11: uncarved(11, 'XI'),
  12: uncarved(12, 'XII')
};

export function isFaceNumber(n: number): n is FaceNumber {
  return Number.isInteger(n) && n >= 1 && n <= 12;
}
