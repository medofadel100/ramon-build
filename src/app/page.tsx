'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0e12]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c5a880] border-t-transparent"></div>
    </div>
  );
}
