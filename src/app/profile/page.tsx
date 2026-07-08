'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { User, Mail, Phone, Briefcase, Calendar, FileText, ChevronLeft, Award, Edit2, Save, X } from 'lucide-react';

interface ProjectListItem {
  id: string;
  header: any;
  createdAt: any;
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone || '');
      setEditJobTitle(user.jobTitle || 'مهندس مكتب فني');
    }
  }, [user, isEditing]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile({ name: editName, phone: editPhone, jobTitle: editJobTitle });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchUserProjects() {
      setLoadingProjects(true);
      try {
        let pQuery;
        if (user!.role === 'admin') {
          // Admins see all projects
          pQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        } else {
          // Engineers see only assigned projects
          pQuery = query(collection(db, 'projects'), where('header.assignedEngineers', 'array-contains', user!.uid));
        }

        const querySnapshot = await getDocs(pQuery);
        let list: ProjectListItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            header: data.header,
            createdAt: data.createdAt,
          } as ProjectListItem);
        });

        // Local sort for non-admins
        if (user!.role !== 'admin') {
          list.sort((a, b) => {
            const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return dateB - dateA;
          });
        }

        setProjects(list);
      } catch (err) {
        console.error('Error fetching user projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    }

    fetchUserProjects();
  }, [user]);

  if (loadingAuth || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    admin: 'مدير النظام',
    qty_engineer: 'مهندس حصر',
    tech_office: 'مكتب فني',
    collaborator: 'مهندس مشارك'
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'مسودة';
      case 'review': return 'تحت المراجعة';
      case 'approved': return 'معتمد فنيًا';
      case 'sent_to_client': return 'مرسل للعميل';
      case 'closed': return 'مغلق/منتهي';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-cairo">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 select-none">
        
        {/* Header Title Section */}
        <div className="flex items-center gap-3 mb-8">
          <Link 
            href="/dashboard" 
            className="p-2 rounded-lg bg-muted border border-border hover:bg-slate-800 text-muted-foreground hover:text-white transition"
            title="العودة للمشاريع"
          >
            <ChevronLeft className="h-4 w-4 transform rotate-180" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground tracking-wide">الملف الشخصي</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Details Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl text-center relative group">
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-muted border border-border text-muted-foreground hover:text-[#c5a880] hover:bg-[#c5a880]/10 transition opacity-0 group-hover:opacity-100"
                  title="تعديل البيانات"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#c5a880] to-[#e5c595] text-primary-foreground font-bold text-3xl shadow-lg mb-4">
                {user.name.charAt(0).toUpperCase()}
              </div>
              
              {isEditing ? (
                <div className="space-y-3 mt-4 text-right">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">الاسم</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-[#1a1c24] px-3 py-1.5 text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 justify-center pt-2">
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 disabled:opacity-50"
                    >
                      {isSaving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#0d0e12] border-t-transparent" /> : <Save className="h-3 w-3" />}
                      حفظ
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-foreground text-xs font-medium hover:bg-slate-700"
                    >
                      <X className="h-3 w-3" />
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                  <span className="inline-block px-3 py-1 mt-2 rounded-md bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                    {roleLabels[user.role] || user.role}
                  </span>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
              <h3 className="text-sm font-bold text-secondary-foreground mb-5 border-b border-border pb-2">بيانات التواصل والوظيفة</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-primary mt-0.5" />
                  <div className="w-full">
                    <span className="block text-[10px] font-semibold text-muted-foreground">المسمى الوظيفي</span>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={editJobTitle}
                        onChange={(e) => setEditJobTitle(e.target.value)}
                        className="w-full mt-1 rounded-lg border border-border bg-[#1a1c24] px-2 py-1 text-sm text-foreground focus:border-[#c5a880] focus:outline-none"
                      />
                    ) : (
                      <span className="text-sm text-foreground font-medium">{user.jobTitle || 'مهندس مكتب فني'}</span>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-primary mt-0.5" />
                  <div className="w-full">
                    <span className="block text-[10px] font-semibold text-muted-foreground">البريد الإلكتروني</span>
                    <span className="text-sm text-foreground font-medium">{user.email}</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-primary mt-0.5" />
                  <div className="w-full">
                    <span className="block text-[10px] font-semibold text-muted-foreground">رقم الهاتف</span>
                    {isEditing ? (
                      <input 
                        type="tel" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full mt-1 rounded-lg border border-border bg-[#1a1c24] px-2 py-1 text-sm text-foreground focus:border-[#c5a880] focus:outline-none text-right dir-rtl"
                        placeholder="01xxxxxxxxx"
                      />
                    ) : (
                      <span className="text-sm text-foreground font-medium">{user.phone || 'غير مسجل'}</span>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <span className="block text-[10px] font-semibold text-muted-foreground">تاريخ الانضمام</span>
                    <span className="text-sm text-foreground font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-EG') : 'غير متوفر'}
                    </span>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/10 p-6 shadow-xl text-center">
              <Award className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-emerald-400">{projects.length}</p>
              <p className="text-xs font-semibold text-emerald-600/80 mt-1">المشاريع المسندة</p>
            </div>
          </div>

          {/* Projects List Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">سابقة الأعمال والمشاريع الحالية</h3>
                <p className="text-xs text-muted-foreground mt-0.5">سجل بجميع المشاريع التي تشارك فيها أو تم إسنادها لك كمهندس.</p>
              </div>
            </div>

            {loadingProjects ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">جاري تحميل المشاريع...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/40">
                <FileText className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">لم يتم إسناد أي مشاريع لك بعد</p>
                <p className="text-xs text-muted-foreground mt-1">عندما تتم دعوتك لمشروع، سيظهر هنا.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <Link 
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group rounded-xl border border-border bg-card p-5 hover:border-[#c5a880]/50 transition duration-200 block shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded tracking-wider">
                        {project.header.projectCode}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded border border-border">
                        {getStatusLabel(project.header.status)}
                      </span>
                    </div>
                    
                    <h4 className="text-base font-bold text-foreground group-hover:text-[#c5a880] transition truncate mb-1">
                      {project.header.name}
                    </h4>
                    
                    <p className="text-xs text-muted-foreground truncate mb-4">
                      المالك: {project.header.ownerName}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        الإصدار: {project.header.issueDate}
                      </span>
                      <span className="text-xs font-semibold text-primary group-hover:underline">
                        عرض التفاصيل
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
