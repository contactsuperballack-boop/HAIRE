import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import WorkspacePicker from '@/components/WorkspacePicker';
import { MEMBERSHIPS_COOKIE } from '@/lib/session';
import type { Membership } from '@/lib/types';

// The cookie may arrive URL-encoded or plain depending on the runtime, so try both.
function parseMemberships(raw: string | undefined): Membership[] {
  if (!raw) return [];
  for (const candidate of [raw, safeDecode(raw)]) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed as Membership[];
    } catch {
      // try the next form
    }
  }
  return [];
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function WorkspacesPage() {
  const raw = (await cookies()).get(MEMBERSHIPS_COOKIE)?.value;
  const memberships = parseMemberships(raw);
  if (memberships.length === 0 && !raw) redirect('/login');

  return (
    <main className="mx-auto max-w-md p-6 pt-16">
      <h1 className="text-2xl font-extrabold">Choose a workspace</h1>
      {memberships.length === 0 ? (
        <p className="mt-3 text-muted">Your account is not a member of any workspace yet. Ask an administrator to add you.</p>
      ) : (
        <div className="mt-6"><WorkspacePicker memberships={memberships} /></div>
      )}
    </main>
  );
}
