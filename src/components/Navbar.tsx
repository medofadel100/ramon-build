'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { LogOut, Home, PlusCircle, Settings, Users, Database, User, BookOpen, Package, Calculator, Store, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const saving = useProjectStore((state) => state.saving);
  const savingOperation = useProjectStore((state) => state.savingOperation);
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <nav className="border-b border-border bg-card/90 px-6 py-4 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Right side: Brand & Nav Links */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#c5a880] to-[#e5c595] text-primary-foreground font-bold text-lg shadow">
              R
            </div>
            <span className="font-cairo text-base font-bold text-foreground hidden md:inline">
              المكتب الفني
            </span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-2 font-cairo text-sm font-medium">
            <Link 
              href="/dashboard" 
              className={`px-3 py-1.5 rounded-lg transition ${
                isActive('/dashboard') ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-white hover:bg-slate-800/50'
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
                isActive('/projects/new') ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-white hover:bg-slate-800/50'
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
                isActive('/dashboard/directory') ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-white hover:bg-slate-800/50'
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
                isActive('/materials') ? 'bg-emerald-500/15 text-emerald-400' : 'text-muted-foreground hover:text-white hover:bg-slate-800/50'
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
                isActive('/admin/constants') ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-white hover:bg-slate-800/50'
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
                isActive('/admin/rates') ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-white hover:bg-slate-800/50'
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
                    isActive('/admin/price-list') ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-white hover:bg-slate-800/50'
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
                    isActive('/admin/users') ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-white hover:bg-slate-800/50'
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
            <div className="flex items-center gap-1.5 font-cairo text-xs text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span>{savingLabels[savingOperation ?? ''] || 'جاري الحفظ تلقائياً...'}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Dropdown */}
          {user && (
            <div className="flex items-center gap-3 border-r border-border pr-4">
              <Link href="/profile" className="text-right hidden xs:block hover:opacity-80 transition group">
                <p className="font-cairo text-sm font-semibold text-foreground leading-tight group-hover:text-[#c5a880]">{user.name}</p>
                <span className="inline-block px-2 py-0.5 mt-0.5 rounded bg-accent text-[10px] text-muted-foreground font-cairo">
                  {roleLabels[user.role] || user.role}
                </span>
              </Link>
              <Link
                href="/profile"
                className="p-2 rounded-lg bg-muted border border-border hover:bg-[#c5a880]/15 hover:text-[#c5a880] text-muted-foreground transition"
                title="الملف الشخصي"
              >
                <User className="h-4 w-4" />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg bg-muted border border-border hover:bg-slate-800/50 hover:text-red-400 text-muted-foreground transition"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-muted border border-border hover:bg-[#c5a880]/15 hover:text-[#c5a880] text-muted-foreground transition"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-card border-b border-border shadow-2xl z-50 p-4 font-cairo animate-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2">
            <Link 
              href="/dashboard" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive('/dashboard') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary-foreground hover:bg-slate-800/50'}`}
            >
              <Home className="h-5 w-5" />
              المشاريع
            </Link>
            <Link 
              href="/projects/new" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive('/projects/new') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary-foreground hover:bg-slate-800/50'}`}
            >
              <PlusCircle className="h-5 w-5" />
              مشروع جديد
            </Link>
            <Link 
              href="/dashboard/directory" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive('/dashboard/directory') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary-foreground hover:bg-slate-800/50'}`}
            >
              <BookOpen className="h-5 w-5" />
              دليل الموردين
            </Link>
            <Link 
              href="/materials" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive('/materials') ? 'bg-emerald-500/15 text-emerald-400 font-bold' : 'text-secondary-foreground hover:bg-slate-800/50'}`}
            >
              <Store className="h-5 w-5" />
              سوق الخامات
            </Link>
            <Link 
              href="/admin/constants" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive('/admin/constants') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary-foreground hover:bg-slate-800/50'}`}
            >
              <Package className="h-5 w-5" />
              الكتالوج المركزي للخامات
            </Link>
            <Link 
              href="/admin/rates" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive('/admin/rates') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary-foreground hover:bg-slate-800/50'}`}
            >
              <Calculator className="h-5 w-5" />
              المعدلات ونسب الهدر
            </Link>

            {user?.role === 'admin' && (
              <>
                <Link 
                  href="/admin/price-list" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive('/admin/price-list') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary-foreground hover:bg-slate-800/50'}`}
                >
                  <Database className="h-5 w-5" />
                  مصنعيات البنود
                </Link>
                <Link 
                  href="/admin/users" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${isActive('/admin/users') ? 'bg-primary/15 text-primary font-bold' : 'text-secondary-foreground hover:bg-slate-800/50'}`}
                >
                  <Users className="h-5 w-5" />
                  المستخدمين
                </Link>
              </>
            )}
            
            <div className="h-px bg-accent my-2"></div>
            
            <Link 
              href="/profile" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition text-secondary-foreground hover:bg-slate-800/50"
            >
              <User className="h-5 w-5" />
              الملف الشخصي
            </Link>
            
            <button
              onClick={() => { setIsMobileMenuOpen(false); handleSignOut(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition text-red-400 hover:bg-slate-800/50 text-right w-full"
            >
              <LogOut className="h-5 w-5" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
