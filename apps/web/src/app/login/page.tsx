import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="text-4xl font-extrabold tracking-wide">HAIRE</h1>
      <p className="mb-8 mt-1 text-sm font-bold tracking-widest text-ink">EVIDENCE-FIRST HIRING</p>
      <LoginForm />
    </main>
  );
}
