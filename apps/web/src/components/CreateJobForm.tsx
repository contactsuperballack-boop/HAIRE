'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { post } from './post';
import { btn, input, label } from '@/lib/styles';

export default function CreateJobForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const job = await post<{ id: string }>('jobs', { title });
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the job');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="title" className={label}>New job title</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={200} className={input} placeholder="Customer service representative" />
      </div>
      <button type="submit" disabled={busy} className={btn}>{busy ? 'Creating…' : 'Create job'}</button>
      <p role="alert" aria-live="polite" className="text-sm font-bold text-danger sm:basis-full">{error}</p>
    </form>
  );
}
