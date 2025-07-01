import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

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