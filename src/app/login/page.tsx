'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('مهندس مكتب فني');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  const signIn = useAuthStore((state) => state.signIn);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal('');
    setLoadingLocal(true);

    if (!email || !password) {
      setErrorLocal('يرجى ملء جميع الحقول المطلوبة');
      setLoadingLocal(false);
      return;
    }

    try {
      if (isRegister) {
        if (!name) {
          setErrorLocal('يرجى إدخال اسم المهندس');
          setLoadingLocal(false);
          return;
        }

        // 1. Create Firebase User
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });

        // 2. Create User Document in Firestore
        const userDocRef = doc(db, 'users', userCred.user.uid);
        await setDoc(userDocRef, {
          uid: userCred.user.uid,
          email,
          name,
          role: 'qty_engineer', // default role
          phone,
          jobTitle,
          createdAt: new Date().toISOString()
        });

      } else {
        await signIn(email, password);
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      const errorCode = err.code || '';
      let friendlyMessage = 'حدث خطأ ما. يرجى إعادة المحاولة.';
      
      switch (errorCode) {
        case 'auth/email-already-in-use':
          friendlyMessage = 'هذا البريد الإلكتروني مسجل بالفعل في النظام. يرجى تسجيل الدخول بدلاً من ذلك، أو استخدام بريد إلكتروني آخر.';
          break;
        case 'auth/invalid-email':
          friendlyMessage = 'البريد الإلكتروني غير صالح. يرجى كتابته بشكل صحيح.';
          break;
        case 'auth/weak-password':
          friendlyMessage = 'كلمة المرور ضعيفة للغاية. يجب أن تتكون من 6 أحرف على الأقل.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          friendlyMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
          break;
        case 'auth/too-many-requests':
          friendlyMessage = 'تم حظر المحاولات مؤقتاً بسبب كثرة الطلبات الفاشلة. يرجى المحاولة لاحقاً.';
          break;
        default:
          friendlyMessage = err.message || friendlyMessage;
      }
      
      setErrorLocal(friendlyMessage);
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-[#13151c] p-8 shadow-2xl backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#c5a880] to-[#e5c595] text-[#0d0e12] font-bold text-2xl shadow-lg">
            R
          </div>
          <h2 className="mt-6 text-center font-cairo text-2xl font-bold tracking-tight text-white">
            المكتب الفني لشركة رامون للتشطيبات والمقاولات
          </h2>
          <p className="mt-2 text-center font-cairo text-sm text-[#8a96a8]">
            {isRegister ? 'إنشاء حساب مهندس جديد في النظام' : 'سجل الدخول لإدارة مشاريع الحصر والكميات'}
          </p>
        </div>

        {errorLocal && (
          <div className="rounded-lg bg-red-950/40 border border-red-800/60 p-3 text-center text-sm text-red-400 font-cairo">
            {errorLocal}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div>
                <label className="block text-right text-xs font-cairo font-medium text-slate-400 mb-1.5">
                  اسم المهندس *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#222634] bg-[#1a1c24] px-4 py-2.5 text-right font-cairo text-sm text-white placeholder-slate-500 focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                  placeholder="مثال: أحمد فاضل"
                />
              </div>
              <div>
                <label className="block text-right text-xs font-cairo font-medium text-slate-400 mb-1.5">
                  المسمى الوظيفي
                </label>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#222634] bg-[#1a1c24] px-4 py-2.5 text-right font-cairo text-sm text-white placeholder-slate-500 focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                >
                  <option value="مهندس مكتب فني">مهندس مكتب فني</option>
                  <option value="مهندس حصر ومواصفات">مهندس حصر ومواصفات</option>
                  <option value="مدير مشاريع">مدير مشاريع</option>
                  <option value="مهندس تنفيذ موقع">مهندس تنفيذ موقع</option>
                </select>
              </div>
              <div>
                <label className="block text-right text-xs font-cairo font-medium text-slate-400 mb-1.5">
                  رقم الهاتف (الواتس اب)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-[#222634] bg-[#1a1c24] px-4 py-2.5 text-right font-cairo text-sm text-white placeholder-slate-500 focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-right text-xs font-cairo font-medium text-slate-400 mb-1.5">
              البريد الإلكتروني *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#222634] bg-[#1a1c24] px-4 py-2.5 text-right font-cairo text-sm text-white placeholder-slate-500 focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880] dir-ltr"
              placeholder="engineer@ramonbuild.com"
            />
          </div>

          <div>
            <label className="block text-right text-xs font-cairo font-medium text-slate-400 mb-1.5">
              كلمة المرور *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#222634] bg-[#1a1c24] px-4 py-2.5 text-right font-cairo text-sm text-white placeholder-slate-500 focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loadingLocal}
            className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#c5a880] to-[#e5c595] py-2.5 font-cairo text-sm font-semibold text-[#0d0e12] shadow-lg hover:brightness-110 active:brightness-95 disabled:opacity-50 transition duration-150"
          >
            {loadingLocal ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0d0e12] border-t-transparent"></div>
            ) : isRegister ? (
              'إنشاء الحساب والتشغيل'
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorLocal('');
            }}
            className="font-cairo text-xs text-[#c5a880] hover:underline"
          >
            {isRegister ? 'لديك حساب بالفعل؟ سجل دخولك' : 'لا تملك حساب؟ اطلب إنشاء حساب أو سجل كمهندس جديد'}
          </button>
        </div>
      </div>
    </div>
  );
}
