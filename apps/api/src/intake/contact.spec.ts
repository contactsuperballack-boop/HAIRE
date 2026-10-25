import { normalizePhone } from './contact';

describe('normalizePhone', () => {
  it('formats international and Nigerian national numbers the same way', () => {
    expect(normalizePhone('+234 801 234 5678')).toBe('+2348012345678');
    expect(normalizePhone('0801 234 5678')).toBe('+2348012345678');
  });

  it('converts a 00 prefix and strips punctuation', () => {
    expect(normalizePhone('(0044) 20 7946-0958')).toBe('+442079460958');
  });

  it('leaves other digit strings as digits only', () => {
    expect(normalizePhone('12345678')).toBe('12345678');
  });
});
