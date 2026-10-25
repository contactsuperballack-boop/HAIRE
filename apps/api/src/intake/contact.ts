// Normalizes phone numbers so the same number is stored the same way. Phone numbers are contact details only:
// they are never used to decide that two applications come from the same person.
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  // Nigerian national format, launch market: 0 followed by 10 digits, e.g. 0801 234 5678.
  if (digits.length === 11 && digits.startsWith('0')) return `+234${digits.slice(1)}`;
  return digits;
}
