import Link from 'next/link';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import { api } from '@/lib/server-api';
import type { Me } from '@/lib/types';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const me = await api<Me>('auth/me');
  if (!me.tenantId) redirect('/workspaces');

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-night text-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
          <Link href="/jobs" className="text-xl font-extrabold tracking-widest">HAIRE</Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/workspaces" className="font-bold underline-offset-4 hover:underline">Switch workspace</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-8 p-4 py-8">{children}</main>
    </div>
  );
}
