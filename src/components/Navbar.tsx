'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { LogOut, Home, PlusCircle, Settings, Users, Database, User, BookOpen, Package, Calculator, Store } from 'lucide-react';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const saving = useProjectStore((state) => state.saving);
  const savingOperation = useProjectStore((state) => state.savingOperation);
  const pathname = usePathname();
  const router = useRouter();

  const savingLabels: Record<string, string> = {
    loadProject: 'تحميل المشروع...',
    updateHeader: 'حفظ بيانات المشروع...',
    updateSharing: 'حفظ إعدادات المشاركة...',
    updateProject: 'حفظ إعدادات المشروع...',
    addZone: 'إضافة مساحة...',
    updateZone: 'تحديث المساحة...',
    deleteZone: 'حذف المساحة...',
    updateItem: 'حفظ بند...',
    addCustomItem: 'إضافة بند مخصص...',
    deleteItem: 'حذف بند...',
    toggleSection: 'تحديث حالة القسم...',
    addSupplier: 'حفظ مورد...',
    updateSupplier: 'تحديث مورد...',
    removeSupplier: 'حذف مورد...',
    addWorker: 'حفظ عامل...',
    updateWorkerData: 'تحديث عامل...',
    removeWorker: 'حذف عامل...',
    addAccount: 'حفظ حساب...',
    updateAccount: 'تحديث حساب...',
    removeAccount: 'حذف حساب...',
    deleteCurrentProject: 'حذف المشروع...'
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Signout error:', err);
    }
  };

  const roleLabels = {
    admin: 'مدير النظام',
    qty_engineer: 'مهندس حصر',
    tech_office: 'مكتب فني',
    collaborator: 'مهندس مشارك'
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-slate-800 bg-[#13151c]/90 px-6 py-4 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Right side: Brand & Nav Links */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#c5a880] to-[#e5c595] text-[#0d0e12] font-bold text-lg shadow">
              R
            </div>
            <span className="font-cairo text-base font-bold text-white hidden md:inline">
              المكتب الفني لشركة رامون
            </span>
          </Link>
          
          <div className="hidden sm:flex items-center gap-2 font-cairo text-sm font-medium">
            <Link 
              href="/dashboard" 
              className={`px-3 py-1.5 rounded-lg transition ${
                isActive('/dashboard') ? 'bg-[#c5a880]/15 text-[#c5a880]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Home className="h-4 w-4" />
                المشاريع
              </span>
            </Link>
            <Link 
              href="/projects/new" 
              className={`px-3 py-1.5 rounded-lg transition ${
                isActive('/projects/new') ? 'bg-[#c5a880]/15 text-[#c5a880]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4" />
                مشروع جديد
              </span>
            </Link>
            <Link 
              href="/dashboard/directory" 
              className={`px-3 py-1.5 rounded-lg transition ${
                isActive('/dashboard/directory') ? 'bg-[#c5a880]/15 text-[#c5a880]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                دليل الموردين
              </span>
            </Link>

            <Link 
              href="/materials" 
              className={`px-3 py-1.5 rounded-lg transition ${
                isActive('/materials') ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <Store className="h-4 w-4" />
                سوق الخامات
              </span>
            </Link>

            <Link 
              href="/admin/constants" 
              className={`px-3 py-1.5 rounded-lg transition ${
                isActive('/admin/constants') ? 'bg-[#c5a880]/15 text-[#c5a880]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Package className="h-4 w-4" />
                الكتالوج المركزي للخامات
              </span>
            </Link>

            <Link 
              href="/admin/rates" 
              className={`px-3 py-1.5 rounded-lg transition ${
                isActive('/admin/rates') ? 'bg-[#c5a880]/15 text-[#c5a880]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Calculator className="h-4 w-4" />
                المعدلات ونسب الهدر
              </span>
            </Link>

            {user?.role === 'admin' && (
              <>
                <Link 
                  href="/admin/price-list" 
                  className={`px-3 py-1.5 rounded-lg transition ${
                    isActive('/admin/price-list') ? 'bg-[#c5a880]/15 text-[#c5a880]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Database className="h-4 w-4" />
                    مصنعيات البنود
                  </span>
                </Link>
                <Link 
                  href="/admin/users" 
                  className={`px-3 py-1.5 rounded-lg transition ${
                    isActive('/admin/users') ? 'bg-[#c5a880]/15 text-[#c5a880]' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    المستخدمين
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Left side: Saving state, User details, Logout */}
        <div className="flex items-center gap-4">
          {saving && (
            <div className="flex items-center gap-1.5 font-cairo text-xs text-[#c5a880]">
              <span className="h-2 w-2 rounded-full bg-[#c5a880] animate-pulse"></span>
              <span>{savingLabels[savingOperation ?? ''] || 'جاري الحفظ تلقائياً...'}</span>
            </div>
          )}

          {user && (
            <div className="flex items-center gap-3 border-r border-slate-800 pr-4">
              <Link href="/profile" className="text-right hidden xs:block hover:opacity-80 transition group">
                <p className="font-cairo text-sm font-semibold text-white leading-tight group-hover:text-[#c5a880]">{user.name}</p>
                <span className="inline-block px-2 py-0.5 mt-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-cairo">
                  {roleLabels[user.role] || user.role}
                </span>
              </Link>
              <Link
                href="/profile"
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-[#c5a880]/15 hover:text-[#c5a880] text-slate-400 transition"
                title="الملف الشخصي"
              >
                <User className="h-4 w-4" />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800/50 hover:text-red-400 text-slate-400 transition"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
