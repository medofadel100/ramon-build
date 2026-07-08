'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { ShieldAlert, Users, Trash2, Edit2, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';

interface SystemUser {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'qty_engineer' | 'tech_office' | 'collaborator';
  phone?: string;
  jobTitle?: string;
  createdAt?: string;
}

export default function AdminUsersPage() {
  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);
  const router = useRouter();

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!loadingAuth) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        alert('صلاحية مقيدة. هذه الصفحة مخصصة لمدراء النظام فقط.');
        router.push('/dashboard');
      }
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    async function loadAllUsers() {
      setLoadingUsers(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const list: SystemUser[] = [];
        querySnapshot.forEach(docSnap => {
          list.push({ uid: docSnap.id, ...docSnap.data() } as SystemUser);
        });
        setUsers(list);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoadingUsers(false);
      }
    }

    loadAllUsers();
  }, [user]);

  const handleRoleChange = async (targetUid: string, newRole: SystemUser['role']) => {
    setUpdatingUid(targetUid);
    try {
      const docRef = doc(db, 'users', targetUid);
      await updateDoc(docRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });

      // Sync local state list
      setUsers(prev => prev.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error(err);
      alert('فشل تحديث الصلاحيات.');
    } finally {
      setUpdatingUid(null);
    }
  };

  if (loadingAuth || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-cairo select-none pb-12">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">إدارة المهندسين والمستخدمين</h1>
            <p className="text-xs text-muted-foreground mt-0.5">تحكم في رتب المهندسين وتوزيع الأدوار الفنية والأمنية داخل النظام.</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-xl border border-amber-950/30 bg-amber-950/5 p-4 flex gap-3 text-amber-500 text-xs font-semibold leading-relaxed">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="text-foreground font-bold">تنبيه أمني فني</p>
            <p className="text-muted-foreground mt-1 font-medium">
              يملك "مدير النظام" القدرة على رؤية وتعديل كافة المشاريع والأسعار وإدارة المستخدمين. يملك "مهندس الحصر" صلاحية إنشاء وتعديل بنود المقايسات والكميات. يملك "مهندس المكتب الفني" صلاحية مراجعة المواصفات وحقول البنود الفنية فقط.
            </p>
          </div>
        </div>

        {/* Users Table */}
        {loadingUsers ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-xs text-muted-foreground">جاري تحميل بيانات المستخدمين...</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl bg-card shadow-lg">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#1a1c24] text-muted-foreground font-bold border-b border-border">
                <tr>
                  <th className="p-3 text-right">اسم المهندس</th>
                  <th className="p-3 text-right">البريد الإلكتروني</th>
                  <th className="p-3 text-center">المسمى الوظيفي</th>
                  <th className="p-3 text-center">رقم الهاتف</th>
                  <th className="p-3 text-center w-40">الدور الفني (الصلاحية)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222634] text-secondary-foreground">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-900/25">
                    <td className="p-3 text-foreground font-bold flex items-center gap-2">
                      <ShieldCheck className={`h-4 w-4 ${u.role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`} />
                      {u.name}
                    </td>
                    <td className="p-3 text-right dir-ltr font-medium text-muted-foreground">{u.email}</td>
                    <td className="p-3 text-center">{u.jobTitle || 'مهندس'}</td>
                    <td className="p-3 text-center">{u.phone || '-'}</td>
                    <td className="p-3 text-center">
                      <select
                        disabled={updatingUid === u.uid || u.uid === user.uid} // Can't edit own role to prevent lockout
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value as any)}
                        className="w-full bg-[#1a1c24] border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-[#c5a880] disabled:opacity-50"
                      >
                        <option value="qty_engineer">مهندس حصر (Quantity)</option>
                        <option value="tech_office">مكتب فني (Technical)</option>
                        <option value="collaborator">مهندس مشارك (Collaborator)</option>
                        <option value="admin">مدير النظام (Admin)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}
