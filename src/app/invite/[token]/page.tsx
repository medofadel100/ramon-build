'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getInviteTokenData, acceptEngineerInvite } from '@/lib/project-service';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const resolvedParams = React.use(params);
  const token = resolvedParams.token;
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    async function checkInvite() {
      if (loadingAuth) return;

      if (!user) {
        // Save the URL to redirect back after login
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        }
        router.push('/login');
        return;
      }

      try {
        // Fetch invite data from DB (we'd need a cloud function or open rule, but for now we assume project is accessible or we query it)
        // Note: In a real secure scenario, this might need a secure endpoint, but we'll use the client function here.
        // The token is global across all projects in our DB structure or we need the projectId in the URL.
        // Wait, our invite token document path is: `projects/{projectId}/inviteTokens/{token}`
        // So the URL should actually be `/invite/[projectId]/[token]`. 
        // If the URL is just `/invite/[token]`, we can't easily find it without a collectionGroup query.
        // Let's modify our logic to use a collection group query or just handle the error here gracefully.
        // I will assume the token data function handles it if we modify it, but for now, let's extract projectId from URL if we pass it, or adjust the path.
      } catch (err) {
        console.error(err);
      }
    }

    checkInvite();
  }, [user, loadingAuth, router, token]);

  // We need to fix the path. I'll create a revised invite page that takes projectId and token.
  return (
    <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center font-cairo p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#222634] bg-[#13151c] p-8 shadow-2xl text-center">
        <Loader2 className="h-10 w-10 text-[#c5a880] animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">جاري التحقق من الدعوة...</h2>
        <p className="text-sm text-slate-400">يرجى الانتظار قليلاً</p>
      </div>
    </div>
  );
}
