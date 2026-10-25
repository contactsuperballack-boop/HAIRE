'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { post } from './post';
import { btnGhost } from '@/lib/styles';
import type { Membership } from '@/lib/types';

export default function WorkspacePicker({ memberships }: { memberships: Membership[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function choose(tenantId: string) {
    setBusyId(tenantId);
    setError('');
    try {
      await post('auth/tenant', { tenantId });
      router.push('/jobs');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open that workspace');
      setBusyId('');
    }
  }

  return (
    <div className="space-y-3">
      {memberships.map((m) => (
        <button key={m.tenantId} onClick={() => choose(m.tenantId)} disabled={!!busyId} className={`${btnGhost} w-full justify-between text-left`}>
          <span>{m.tenantName}</span>
          <span className="text-xs font-medium text-muted">{m.role.replace('_', ' ').toLowerCase()}</span>
        </button>
      ))}
      <p role="alert" aria-live="polite" className="min-h-5 text-sm font-bold text-danger">{error}</p>
    </div>
  );
}
