import Link from 'next/link';
import ActionButton from '@/components/ActionButton';
import ProfileBuilder from '@/components/ProfileBuilder';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/server-api';
import { card } from '@/lib/styles';
import { ADMIN_ROLES, STAFF_ROLES, type ApplicationRow, type Job, type Me, type Page, type Profile } from '@/lib/types';

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, job, profiles, applications] = await Promise.all([
    api<Me>('auth/me'),
    api<Job>(`jobs/${id}`),
    api<Profile[]>(`jobs/${id}/profiles`),
    api<Page<ApplicationRow>>(`jobs/${id}/applications?limit=50`),
  ]);
  const isAdmin = !!me.role && ADMIN_ROLES.includes(me.role);
  const isStaff = !!me.role && STAFF_ROLES.includes(me.role);
  const hasApproved = profiles.some((p) => p.status === 'APPROVED');

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/jobs" className="text-sm font-bold text-ink underline-offset-4 hover:underline">← All jobs</Link>
          <h1 className="mt-1 text-3xl font-extrabold">{job.title}</h1>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {job.status === 'OPEN' && (
        <section className={card}>
          <h2 className="font-extrabold">Application link</h2>
          <p className="mt-1 break-all text-sm text-muted">Share this with candidates: <code>/apply/{job.id}</code></p>
        </section>
      )}
      {job.status === 'DRAFT' && isAdmin && (
        <section className={card}>
          <h2 className="font-extrabold">Open for applications</h2>
          <p className="mb-3 mt-1 text-sm text-muted">{hasApproved ? 'The approved Hiring Profile will be used to organize evidence for every applicant.' : 'Approve a Hiring Profile first.'}</p>
          {hasApproved && <ActionButton path={`jobs/${job.id}/open`} label="Open job" />}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold">Hiring Profiles</h2>
        {profiles.length === 0 && <p className="text-muted">No profile yet. Draft one below.</p>}
        {profiles.map((p) => (
          <article key={p.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-extrabold">Version {p.version}</h3>
              <StatusBadge status={p.status} />
            </div>
            <p className="mt-3 text-sm font-bold">Must have</p>
            <ul className="text-sm text-muted">{p.criteria.mustHave.map((c) => <li key={c.name}>{c.name} (weight {c.weight})</li>)}</ul>
            {p.criteria.preferred.length > 0 && (
              <>
                <p className="mt-3 text-sm font-bold">Preferred</p>
                <ul className="text-sm text-muted">{p.criteria.preferred.map((c) => <li key={c.name}>{c.name} (weight {c.weight})</li>)}</ul>
              </>
            )}
            {p.status === 'DRAFT' && isAdmin && <div className="mt-4"><ActionButton path={`profiles/${p.id}/approve`} label="Approve this version" /></div>}
          </article>
        ))}
        {isStaff && (
          <div className={card}>
            <h3 className="mb-4 font-extrabold">Draft a new version</h3>
            <ProfileBuilder jobId={job.id} />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-extrabold">Applicants</h2>
        {applications.items.length === 0 ? (
          <p className="text-muted">No applications yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white/70">
            {applications.items.map((a) => (
              <li key={a.id}>
                <Link href={`/applications/${a.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-paper-deep">
                  <span className="font-bold">{a.applicant.fullName}</span>
                  <span className="flex items-center gap-3 text-sm text-muted">
                    {new Date(a.createdAt).toLocaleDateString('en-GB')}
                    <StatusBadge status={a.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
