'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { post } from './post';
import { btn, input, label } from '@/lib/styles';

export default function DecisionForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [type, setType] = useState('ADVANCE');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await post(`applications/${applicationId}/decision`, { type, reason });
      setReason('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the decision');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="type" className={label}>Decision</label>
        <select id="type" value={type} onChange={(e) => setType(e.target.value)} className={input}>
          <option value="ADVANCE">Advance to shortlist</option>
          <option value="HOLD">Hold</option>
          <option value="REJECT">Reject</option>
        </select>
      </div>
      <div>
        <label htmlFor="reason" className={label}>Reason (kept with the record)</label>
        <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} maxLength={2000} rows={3} className={input} />
      </div>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm font-bold text-danger">{error}</p>
      <button type="submit" disabled={busy} className={btn}>{busy ? 'Saving…' : 'Record decision'}</button>
    </form>
  );
}
