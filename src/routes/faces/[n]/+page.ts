import { error } from '@sveltejs/kit';
import { FACES, isFaceNumber } from '$lib/faces';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
  const n = Number(params.n);
  if (!isFaceNumber(n)) {
    error(404, 'No such face.');
  }
  return {
    face_number: n,
    entry: FACES[n]
  };
};
