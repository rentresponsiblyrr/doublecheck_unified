import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  // Redirect based on user role
  if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') {
    redirect('/dashboard');
  } else {
    redirect('/inspector');
  }
}