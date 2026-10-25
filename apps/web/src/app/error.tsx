'use client';

import { btn } from '@/lib/styles';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-extrabold">Something went wrong</h1>
      <p className="mt-2 text-muted">The page could not load. Try again, and if it keeps happening, contact support.</p>
      <button onClick={reset} className={`${btn} mt-6`}>Try again</button>
    </main>
  );
}
