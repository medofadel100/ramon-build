'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getInviteTokenData, acceptEngineerInvite } from '@/lib/project-service';
import { Shield, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface InvitePageProps {
  params: Promise<{ projectId: string; token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const resolvedParams = React.use(params);
  const { projectId, token } = resolvedParams;
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    async function processInvite() {
      if (loadingAuth) return;

      if (!user) {
        // Redirect to login but save the current URL
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        }
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        // 1. Verify token
        const data = await getInviteTokenData(projectId, token);
        
        if (!data) {
          setError('رابط الدعوة غير صالح أو غير موجود.');
          setLoading(false);
          return;
        }

        if (data.used) {
          setError('عذراً، رابط الدعوة هذا تم استخدامه مسبقاً.');
          setLoading(false);
          return;
        }

        setInviteData(data);

        // 2. Accept invite
        const success = await acceptEngineerInvite(
          projectId, 
          token, 
          user.uid, 
          user.name || user.email.split('@')[0], 
          user.email,
          user.jobTitle
        );

        if (success) {
          setSuccess(true);
        } else {
          setError('حدث خطأ أثناء قبول الدعوة. قد يكون الرابط منتهي الصلاحية أو تم استخدامه.');
        }

      } catch (err: any) {
        console.error('Error processing invite:', err);
        setError('حدث خطأ في النظام. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    }

    processInvite();
  }, [user, loadingAuth, router, projectId, token]);

  if (loading || loadingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-cairo">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl text-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">جاري التحقق من الدعوة...</h2>
            <p className="text-sm text-muted-foreground">يرجى الانتظار قليلاً</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-cairo">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl text-center">
          
          {error && (
            <div className="animate-in zoom-in duration-300">
              <div className="mx-auto w-16 h-16 bg-rose-950/50 rounded-full flex items-center justify-center border border-rose-900/50 mb-6">
                <XCircle className="h-8 w-8 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-3">الدعوة غير صالحة</h2>
              <p className="text-sm text-muted-foreground mb-8">{error}</p>
              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted text-foreground text-sm font-bold border border-border hover:bg-slate-800 transition"
              >
                العودة للوحة التحكم
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {success && (
            <div className="animate-in zoom-in duration-300">
              <div className="mx-auto w-16 h-16 bg-emerald-950/50 rounded-full flex items-center justify-center border border-emerald-900/50 mb-6">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">تم قبول الدعوة بنجاح!</h2>
              <p className="text-sm text-muted-foreground mb-2">
                تم إضافتك إلى فريق العمل كـ 
                <span className="text-primary font-bold mx-1 px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                  {inviteData?.specialtyLabel || 'مهندس'}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mb-8">يمكنك الآن الوصول إلى المشروع والتعديل عليه.</p>
              
              <Link
                href={`/projects/${projectId}`}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:brightness-110 shadow-lg shadow-[#c5a880]/20 transition"
              >
                الدخول إلى المشروع
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
