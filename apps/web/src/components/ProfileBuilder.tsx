'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { post } from './post';
import { btn, btnGhost, input, label } from '@/lib/styles';

interface Row { name: string; weight: number }

function CriteriaList({ title, rows, setRows }: { title: string; rows: Row[]; setRows: (r: Row[]) => void }) {
  const update = (i: number, patch: Partial<Row>) => setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <fieldset className="space-y-2">
      <legend className={label}>{title}</legend>
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <input aria-label={`${title} name ${i + 1}`} value={row.name} onChange={(e) => update(i, { name: e.target.value })} className={input} placeholder="e.g. Written communication" maxLength={120} />
          <input aria-label={`${title} weight ${i + 1}`} type="number" min={1} max={10} value={row.weight} onChange={(e) => update(i, { weight: Number(e.target.value) })} className={`${input} w-20!`} />
          <button type="button" onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className={btnGhost} aria-label={`Remove ${title} ${i + 1}`}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => setRows([...rows, { name: '', weight: 5 }])} className={btnGhost}>Add criterion</button>
    </fieldset>
  );
}

export default function ProfileBuilder({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [mustHave, setMustHave] = useState<Row[]>([{ name: '', weight: 8 }]);
  const [preferred, setPreferred] = useState<Row[]>([]);
  const [dimensions, setDimensions] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const clean = (rows: Row[]) => rows.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), weight: r.weight }));
    try {
      await post(`jobs/${jobId}/profiles`, {
        criteria: {
          mustHave: clean(mustHave),
          preferred: clean(preferred),
          assessmentDimensions: dimensions.split(',').map((d) => d.trim()).filter(Boolean),
          constraints: { ...(workMode ? { workMode } : {}), ...(location.trim() ? { location: location.trim() } : {}) },
        },
      });
      setMustHave([{ name: '', weight: 8 }]);
      setPreferred([]);
      setDimensions('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the profile');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-muted">Weights run from 1 (nice to have) to 10 (critical). Saving creates a draft that an admin must approve.</p>
      <CriteriaList title="Must-have criteria" rows={mustHave} setRows={setMustHave} />
      <CriteriaList title="Preferred criteria" rows={preferred} setRows={setPreferred} />
      <div>
        <label htmlFor="dims" className={label}>Assessment dimensions (comma separated)</label>
        <input id="dims" value={dimensions} onChange={(e) => setDimensions(e.target.value)} className={input} placeholder="Written communication, Customer handling" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mode" className={label}>Work mode</label>
          <select id="mode" value={workMode} onChange={(e) => setWorkMode(e.target.value)} className={input}>
            <option value="">Not specified</option>
            <option value="ONSITE">On-site</option>
            <option value="HYBRID">Hybrid</option>
            <option value="REMOTE">Remote</option>
          </select>
        </div>
        <div>
          <label htmlFor="loc" className={label}>Location</label>
          <input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} className={input} maxLength={200} placeholder="Lagos" />
        </div>
      </div>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm font-bold text-danger">{error}</p>
      <button type="submit" disabled={busy} className={btn}>{busy ? 'Saving…' : 'Save draft profile'}</button>
    </form>
  );
}
