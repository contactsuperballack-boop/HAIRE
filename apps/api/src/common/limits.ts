// Largest JSON body the API accepts. The apply schema is sized so its worst case (every character three bytes
// in UTF-8) still fits: see intake.schema.spec.ts, which tests this.
export const MAX_BODY_BYTES = 256 * 1024;
