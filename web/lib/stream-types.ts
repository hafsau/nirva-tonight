/** One step of a streamed reflection. `v` sets the value at `p`; `done` closes the field at `p`. */
export interface Patch {
  p: (string | number)[];
  v?: unknown;
  done?: true;
}
