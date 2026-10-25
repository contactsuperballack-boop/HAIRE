import ActionButton from '@/components/ActionButton';
import DecisionForm from '@/components/DecisionForm';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/server-api';
import { card } from '@/lib/styles';
import { STAFF_ROLES, type ApplicationDetail, type Me } from '@/lib/types';

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, app] = await Promise.all([api<Me>('auth/me'), api<ApplicationDetail>(`applications/${id}`)]);
  const isStaff = !!me.role && STAFF_ROLES.includes(me.role);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{app.applicant.fullName}</h1>
          <p className="mt-1 text-sm text-muted">{[app.applicant.email, app.applicant.phone].filter(Boolean).join(' · ')}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl font-extrabold">Evidence</h2>
        <p className="text-sm text-muted">
          Each item shows its status. “Inferred” means a keyword or pattern match that no one has verified. “Unknown” means no evidence was found. Software organizes evidence; a person decides.
        </p>
        {app.evidence.length === 0 ? (
          <p className="text-muted">No evidence extracted yet.</p>
        ) : (
          <ul className="space-y-3">
            {app.evidence.map((e) => (
              <li key={e.id} className={card}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{e.claim}</span>
                  <StatusBadge status={e.status} />
                </div>
                {e.sourceExcerpt && <blockquote className="mt-2 border-l-4 border-brass pl-3 text-sm text-muted">{e.sourceExcerpt}</blockquote>}
              </li>
            ))}
          </ul>
        )}
        {isStaff && <ActionButton path={`applications/${app.id}/evidence/run`} label={app.evidence.length ? 'Re-run evidence extraction' : 'Run evidence extraction'} />}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-extrabold">Submitted material</h2>
        {app.answers.map((a, i) => (
          <div key={i} className={card}>
            <p className="text-sm font-bold">{a.question}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{a.answer}</p>
          </div>
        ))}
        <div className={card}>
          <p className="text-sm font-bold">CV</p>
          <p className="mt-1 max-h-96 overflow-auto whitespace-pre-wrap text-sm text-muted">{app.cvText || 'No CV text submitted.'}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-extrabold">Decision</h2>
        {app.decisions.length > 0 && (
          <ul className="space-y-2">
            {app.decisions.map((d) => (
              <li key={d.id} className={card}>
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={d.type} />
                  <span className="text-xs text-muted">{new Date(d.createdAt).toLocaleString('en-GB')}</span>
                </div>
                <p className="mt-2 text-sm">{d.reason}</p>
              </li>
            ))}
          </ul>
        )}
        {isStaff ? <div className={card}><DecisionForm applicationId={app.id} /></div> : <p className="text-sm text-muted">Your role can review applications but not record decisions.</p>}
      </section>
    </>
  );
}
