'use client';

import { useState } from 'react';
import { post } from './post';
import { btn, input, label } from '@/lib/styles';

export interface ConsentNotice { version: string; title: string; paragraphs: string[]; consentLabel: string }

// The notice text comes from the API, so the wording shown is the wording the server records with the consent.
export default function ApplyForm({ jobId, notice }: { jobId: string; notice: ConsentNotice }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') ?? '').trim();
    const phone = String(f.get('phone') ?? '').trim();
    const experience = String(f.get('experience') ?? '').trim();
    try {
      await post(`public/jobs/${jobId}/apply`, {
        fullName: f.get('fullName'),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        cvText: String(f.get('cvText') ?? ''),
        answers: experience ? [{ question: 'Tell us about your relevant experience', answer: experience }] : [],
        consent: { granted: f.get('consent') === 'on', noticeVersion: notice.version },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your application');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-2xl border border-line bg-white/70 p-6">
        <h2 className="text-xl font-extrabold">Application received</h2>
        <p className="mt-2 text-muted">Thank you. The hiring team will review your application and may contact you using the details you gave.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="fullName" className={label}>Full name</label>
        <input id="fullName" name="fullName" required maxLength={200} autoComplete="name" className={input} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" className={input} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>Phone (WhatsApp if possible)</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className={input} placeholder="+234 …" />
        </div>
      </div>
      <p className="-mt-2 text-sm text-muted">Give at least an email or a phone number.</p>
      <div>
        <label htmlFor="cvText" className={label}>Your CV (paste the text)</label>
        <textarea id="cvText" name="cvText" rows={8} maxLength={20000} className={input} />
      </div>
      <div>
        <label htmlFor="experience" className={label}>Tell us about your relevant experience</label>
        <textarea id="experience" name="experience" rows={4} maxLength={2000} className={input} />
      </div>
      <div className="rounded-xl border border-line bg-paper-deep p-4 text-sm leading-relaxed">
        <p className="font-bold">{notice.title}</p>
        {notice.paragraphs.map((text, i) => <p key={i} className="mt-1">{text}</p>)}
        <label className="mt-3 flex items-start gap-3 font-bold">
          <input type="checkbox" name="consent" required className="mt-1 h-5 w-5" />
          <span>{notice.consentLabel}</span>
        </label>
      </div>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm font-bold text-danger">{error}</p>
      <button type="submit" disabled={busy} className={`${btn} w-full sm:w-auto`}>{busy ? 'Submitting…' : 'Submit application'}</button>
    </form>
  );
}
