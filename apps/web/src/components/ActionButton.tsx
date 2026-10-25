'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { post } from './post';
import { btn } from '@/lib/styles';

// A button that POSTs to the API, shows any error, and refreshes the page data.
export default function ActionButton({ path, label, doneLabel }: { path: string; label: string; doneLabel?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  async function run() {
    setBusy(true);
    setError('');
    setNote('');
    try {
      const result = await post<{ ok?: boolean; reason?: string; claimCount?: number }>(path);
      if (result && result.ok === false) setNote(result.reason === 'needs_human_review' ? 'The agent output could not be accepted. A person needs to review this application.' : 'The model provider failed. Try again later.');
      else if (doneLabel) setNote(doneLabel);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button onClick={run} disabled={busy} className={btn}>{busy ? 'Working…' : label}</button>
      <p role="alert" aria-live="polite" className="mt-2 text-sm font-bold text-danger">{error}</p>
      {note && <p aria-live="polite" className="mt-2 text-sm text-muted">{note}</p>}
    </div>
  );
}
