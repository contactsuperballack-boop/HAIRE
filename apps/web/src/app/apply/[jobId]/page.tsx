import { notFound } from 'next/navigation';
import ApplyForm, { type ConsentNotice } from '@/components/ApplyForm';
import { forwardedHeaders } from '@/lib/server-api';
import { API_BASE_URL } from '@/lib/session';

export default async function ApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const res = await fetch(`${API_BASE_URL}/v1/public/jobs/${encodeURIComponent(jobId)}`, { headers: await forwardedHeaders(), cache: 'no-store' });
  if (res.status === 404 || res.status === 400) notFound();
  if (!res.ok) throw new Error('Could not load the job');
  const job = (await res.json()) as { title: string; notice: ConsentNotice };

  return (
    <main className="mx-auto max-w-xl p-6 pb-16">
      <p className="text-sm font-bold tracking-widest text-ink">HAIRE</p>
      <h1 className="mb-1 mt-2 text-3xl font-extrabold">{job.title}</h1>
      <p className="mb-8 text-muted">Apply in a few minutes. It works on a phone.</p>
      <ApplyForm jobId={jobId} notice={job.notice} />
    </main>
  );
}
