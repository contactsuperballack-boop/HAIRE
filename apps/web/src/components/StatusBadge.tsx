import type { EvidenceStatus } from '@/lib/types';

const STYLE: Record<string, string> = {
  VERIFIED: 'bg-ink text-paper',
  SUPPORTED: 'bg-ink/15 text-ink',
  INFERRED: 'bg-brass/25 text-night',
  UNKNOWN: 'bg-paper-deep text-muted',
  CONTRADICTORY: 'bg-danger/15 text-danger',
};

// Always shows the status as words, never colour alone.
export default function StatusBadge({ status }: { status: EvidenceStatus | string }) {
  const style = STYLE[status] ?? 'bg-paper-deep text-night';
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${style}`}>{status.toLowerCase().replace('_', ' ')}</span>;
}
