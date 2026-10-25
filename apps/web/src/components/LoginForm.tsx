'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn, input, label } from '@/lib/styles';

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; memberships?: { tenantId: string }[] };
    if (!res.ok) {
      setError(data.message ?? 'Could not sign in');
      setBusy(false);
      return;
    }
    router.push('/workspaces');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className={label}>Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={input} />
      </div>
      <div>
        <label htmlFor="password" className={label}>Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm font-bold text-danger">{error}</p>
      <button type="submit" disabled={busy} className={`${btn} w-full`}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
