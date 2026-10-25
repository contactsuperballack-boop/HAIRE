import Link from 'next/link';
import CreateJobForm from '@/components/CreateJobForm';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/server-api';
import { card } from '@/lib/styles';
import { STAFF_ROLES, type Job, type Me, type Page } from '@/lib/types';

export default async function JobsPage() {
  const [me, jobs] = await Promise.all([api<Me>('auth/me'), api<Page<Job>>('jobs?limit=50')]);
  const canCreate = !!me.role && STAFF_ROLES.includes(me.role);

  return (
    <>
      <h1 className="text-3xl font-extrabold">Jobs</h1>
      {canCreate && <section className={card}><CreateJobForm /></section>}
      {jobs.items.length === 0 ? (
        <p className="text-muted">No jobs yet.{canCreate ? ' Create the first one above.' : ''}</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white/70">
          {jobs.items.map((job) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-paper-deep">
                <span className="font-bold">{job.title}</span>
                <span className="flex items-center gap-3 text-sm text-muted">
                  {new Date(job.createdAt).toLocaleDateString('en-GB')}
                  <StatusBadge status={job.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {jobs.nextCursor && <p className="text-sm text-muted">Showing the 50 most recent jobs.</p>}
    </>
  );
}
