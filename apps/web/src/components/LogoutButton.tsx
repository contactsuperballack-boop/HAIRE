'use client';

import { useRouter } from 'next/navigation';
import { btnGhost } from '@/lib/styles';

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }
  return <button onClick={logout} className={btnGhost}>Sign out</button>;
}
