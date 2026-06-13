'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { Search, Filter, Plus, Calendar, MapPin, Phone, User, MessageCircle, FileText } from 'lucide-react';
import Link from 'next/link';

interface ProjectListItem {
  id: string;
  header: {
    name: string;
    ownerName: string;
    ownerPhone: string;
    projectCode: string;
    governorate: string;
    addressDetails: string;
    issueDate: string;
    status: 'draft' | 'review' | 'approved' | 'sent_to_client' | 'closed';
    projectType: {
      workType: 'new_build' | 'finishing_only' | 'renovation';
      hasArchModification: boolean;
      foundationType: 'full' | 'partial' | 'none';
    };
    assignedEngineers: string[];
  };
  createdAt: any;
  updatedAt: any;
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const loadingAuth = useAuthStore((state) => state.loading);
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchProjects() {
      setLoadingProjects(true);
      try {
        const pQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(pQuery);
        const list: ProjectListItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Access permissions: Admin sees all. Collaborator/Engineer sees if they are assigned.
          if (
            user && (
              user.role === 'admin' ||
              (data.header?.assignedEngineers && data.header.assignedEngineers.includes(user.uid))
            )
          ) {
            list.push({
              id: docSnap.id,
              header: data.header,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            } as ProjectListItem);
          }
        });
        setProjects(list);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    }

    fetchProjects();
  }, [user]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.header.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.header.projectCode.toLowerCase().includes(searchText.toLowerCase()) ||
      project.header.ownerName.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.header.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'review':
        return 'bg-amber-950/40 text-amber-400 border-amber-800/50';
      case 'approved':
        return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50';
      case 'sent_to_client':
        return 'bg-sky-950/40 text-sky-400 border-sky-800/50';
      case 'closed':
        return 'bg-rose-950/40 text-rose-400 border-rose-800/50';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
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

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'new_build': return 'إنشاء جديد كامل';
      case 'finishing_only': return 'تشطيب فقط';
      case 'renovation': return 'تجديد / تشطيب جزئي';
      default: return type;
    }
  };

  if (loadingAuth || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d0e12]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c5a880] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e12] flex flex-col font-cairo">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 select-none">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">مشاريع الحصر والكميات</h1>
            <p className="text-sm text-slate-400 mt-1">
              مرحباً بك {user.name}. إليك المشاريع التي تعمل عليها حالياً.
            </p>
          </div>
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#c5a880] to-[#e5c595] text-[#0d0e12] font-semibold text-sm shadow hover:brightness-110 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            إنشاء مشروع جديد
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ابحث باسم المشروع، الكود، أو اسم المالك..."
              className="w-full rounded-lg border border-[#222634] bg-[#13151c] py-3 pl-4 pr-11 text-right text-sm text-white placeholder-slate-500 focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880]"
            />
          </div>
          <div className="relative">
            <Filter className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-[#222634] bg-[#13151c] py-3 pl-4 pr-11 text-right text-sm text-white focus:border-[#c5a880] focus:outline-none focus:ring-1 focus:ring-[#c5a880] appearance-none"
            >
              <option value="all">كل حالات المشاريع</option>
              <option value="draft">مسودة</option>
              <option value="review">تحت المراجعة</option>
              <option value="approved">معتمد فنيًا</option>
              <option value="sent_to_client">مرسل للعميل</option>
              <option value="closed">مغلق/منتهي</option>
            </select>
          </div>
        </div>

        {/* Projects Grid Grid */}
        {loadingProjects ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#c5a880] border-t-transparent"></div>
            <p className="text-sm text-slate-400">جاري تحميل قائمة المشاريع...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#222634] rounded-2xl bg-[#13151c]/40">
            <FileText className="h-12 w-12 text-[#c5a880]/30 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">لم يتم العثور على أي مشاريع مطابقة</p>
            <p className="text-xs text-slate-500 mt-1">ابدأ بإنشاء مشروع جديد عبر الضغط على الزر بالأعلى</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div 
                key={project.id}
                className="group relative flex flex-col justify-between rounded-xl border border-[#222634] bg-[#13151c] hover:border-[#c5a880]/60 p-6 shadow-md transition duration-200"
              >
                <div>
                  {/* Top line code & status */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-[#c5a880] bg-[#c5a880]/10 px-2.5 py-1 rounded-md tracking-wider">
                      {project.header.projectCode}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${getStatusStyle(project.header.status)}`}>
                      {getStatusLabel(project.header.status)}
                    </span>
                  </div>

                  {/* Project Title */}
                  <h3 className="text-lg font-bold text-white group-hover:text-[#c5a880] transition">
                    <Link href={`/projects/${project.id}`} className="focus:outline-none">
                      {project.header.name}
                    </Link>
                  </h3>

                  {/* Wizard Type */}
                  <p className="text-xs text-[#8a96a8] mt-1.5 font-medium">
                    {getProjectTypeLabel(project.header.projectType.workType)}
                    {project.header.projectType.hasArchModification && ' • تعديل معماري'}
                  </p>

                  <div className="border-t border-[#222634] my-4"></div>

                  {/* Details block */}
                  <div className="space-y-2.5 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span>المالك: {project.header.ownerName}</span>
                      {project.header.ownerPhone && (
                        <a 
                          href={`https://wa.me/2${project.header.ownerPhone}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-emerald-500 hover:text-emerald-400 mr-auto transition"
                          title="محادثة واتساب"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span className="truncate">الموقع: {project.header.governorate} - {project.header.addressDetails}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>تاريخ الإصدار: {project.header.issueDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 text-center py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-white hover:bg-[#c5a880]/10 hover:border-[#c5a880]/50 transition"
                  >
                    لوحة التحكم
                  </Link>
                  <Link
                    href={`/projects/${project.id}/export`}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-[#c5a880] hover:border-[#c5a880]/50 transition"
                    title="تصدير التقارير"
                  >
                    <FileText className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
