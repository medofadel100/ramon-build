'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar';
import { Search, Filter, Plus, Calendar, MapPin, Phone, User, MessageCircle, FileText, Trash2, AlertTriangle, X, BookOpen, Activity, LayoutDashboard, CheckCircle2, Clock, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

  // Deletion state
  const [projectToDelete, setProjectToDelete] = useState<ProjectListItem | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
        let pQuery;
        if (user!.role === 'admin') {
          pQuery = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        } else {
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
            updatedAt: data.updatedAt
          } as ProjectListItem);
        });

        // Local sort for non-admins to avoid needing a complex composite index
        if (user!.role !== 'admin') {
          list.sort((a, b) => {
            const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return dateB - dateA;
          });
        }

        setProjects(list);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    }

    fetchProjects();
  }, [user]);

  const deleteProjectById = useProjectStore((state) => state.deleteProjectById);

  const handleDeleteProject = async () => {
    if (!projectToDelete || deleteInput !== projectToDelete.header.name) return;
    
    setIsDeleting(true);
    try {
      await deleteProjectById(projectToDelete.id);
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setProjectToDelete(null);
      setDeleteInput('');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('حدث خطأ أثناء حذف المشروع.');
    } finally {
      setIsDeleting(false);
    }
  };

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

  // KPIs Calculations
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.header.status !== 'closed').length;
  const completedProjects = projects.filter(p => p.header.status === 'closed').length;
  const sentToClientProjects = projects.filter(p => p.header.status === 'sent_to_client').length;

  // Chart Data preparation
  const statusData = [
    { name: 'مسودة', value: projects.filter(p => p.header.status === 'draft').length, color: '#475569' },
    { name: 'تحت المراجعة', value: projects.filter(p => p.header.status === 'review').length, color: '#f59e0b' },
    { name: 'معتمد فنيًا', value: projects.filter(p => p.header.status === 'approved').length, color: '#10b981' },
    { name: 'مرسل للعميل', value: sentToClientProjects, color: '#0ea5e9' },
    { name: 'مغلق/منتهي', value: completedProjects, color: '#f43f5e' }
  ].filter(d => d.value > 0);

  const typeData = [
    { name: 'إنشاء جديد', value: projects.filter(p => p.header.projectType.workType === 'new_build').length },
    { name: 'تشطيب فقط', value: projects.filter(p => p.header.projectType.workType === 'finishing_only').length },
    { name: 'تجديد', value: projects.filter(p => p.header.projectType.workType === 'renovation').length },
  ].filter(d => d.value > 0);

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
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'admin' && (
              <Link
                href="/admin/constants"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a1c24] border border-[#222634] text-white font-semibold text-sm shadow hover:border-[#c5a880]/50 hover:bg-slate-800 transition"
              >
                <BookOpen className="h-4 w-4 text-[#c5a880]" />
                المعدلات الهندسية والخامات
              </Link>
            )}
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#c5a880] to-[#e5c595] text-[#0d0e12] font-semibold text-sm shadow hover:brightness-110 active:scale-95 transition"
            >
              <Plus className="h-4 w-4" />
              إنشاء مشروع جديد
            </Link>
          </div>
        </div>

        {/* --- Analytics Board --- */}
        {!loadingProjects && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-[#222634] bg-[#1a1c24] p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-900/20 text-blue-400 rounded-lg">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">إجمالي المشاريع</p>
                <p className="text-2xl font-bold text-white mt-1">{filteredProjects.length}</p>
              </div>
            </div>
            
            <div className="rounded-xl border border-[#222634] bg-[#1a1c24] p-5 flex items-center gap-4">
              <div className="p-3 bg-amber-900/20 text-[#c5a880] rounded-lg">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">قيد التسعير (مسودة)</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {filteredProjects.filter(p => p.header.status === 'draft').length}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#222634] bg-[#1a1c24] p-5 flex items-center gap-4">
              <div className="p-3 bg-sky-900/20 text-sky-400 rounded-lg">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">تحت المراجعة</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {filteredProjects.filter(p => p.header.status === 'review' || p.header.status === 'sent_to_client').length}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#222634] bg-[#1a1c24] p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-900/20 text-emerald-400 rounded-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">معتمد فنيًا (جاري التنفيذ)</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {filteredProjects.filter(p => p.header.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
        )}

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

        {/* Executive Dashboard KPIs (Phase 5) */}
        {!loadingProjects && totalProjects > 0 && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-[#c5a880]" />
              اللوحة التنفيذية
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#13151c] border border-[#222634] p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a880]/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="w-12 h-12 rounded-xl bg-[#c5a880]/10 flex items-center justify-center text-[#c5a880] shrink-0 border border-[#c5a880]/20 z-10">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="z-10">
                  <div className="text-xs text-slate-400 font-medium mb-1">إجمالي المشاريع</div>
                  <div className="text-2xl font-black text-white">{totalProjects}</div>
                </div>
              </div>
              <div className="bg-[#13151c] border border-[#222634] p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0 border border-sky-500/20 z-10">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="z-10">
                  <div className="text-xs text-slate-400 font-medium mb-1">المشاريع النشطة</div>
                  <div className="text-2xl font-black text-white">{activeProjects}</div>
                </div>
              </div>
              <div className="bg-[#13151c] border border-[#222634] p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20 z-10">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="z-10">
                  <div className="text-xs text-slate-400 font-medium mb-1">المشاريع المنجزة</div>
                  <div className="text-2xl font-black text-white">{completedProjects}</div>
                </div>
              </div>
              <div className="bg-[#13151c] border border-[#222634] p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/20 z-10">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="z-10">
                  <div className="text-xs text-slate-400 font-medium mb-1">مرسلة للعميل</div>
                  <div className="text-2xl font-black text-white">{sentToClientProjects}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Project Status Chart */}
              <div className="bg-[#13151c] border border-[#222634] rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">حالة المشاريع الحالية</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#13151c', borderColor: '#222634', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        formatter={(value: any) => [Number(value || 0), 'عدد المشاريع']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                  {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs text-slate-400">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      {entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Type Chart */}
              <div className="bg-[#13151c] border border-[#222634] rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">أنواع المشاريع</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222634" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#13151c', borderColor: '#222634', borderRadius: '12px' }}
                        itemStyle={{ color: '#c5a880', fontWeight: 'bold' }}
                        cursor={{ fill: '#222634', opacity: 0.4 }}
                        formatter={(value: any) => [Number(value || 0), 'مشروع']}
                      />
                      <Bar dataKey="value" fill="#c5a880" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  {user && user.role === 'admin' && (
                    <button
                      onClick={() => setProjectToDelete(project)}
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-rose-500/60 hover:text-rose-400 hover:border-rose-900/50 transition"
                      title="حذف المشروع"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#13151c] border border-rose-900/50 rounded-2xl shadow-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-rose-950/50 text-rose-500">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">حذف المشروع نهائياً</h3>
                  <p className="text-xs text-rose-400/80">هذا الإجراء لا يمكن التراجع عنه.</p>
                </div>
              </div>
              <button 
                onClick={() => { setProjectToDelete(null); setDeleteInput(''); }}
                className="text-slate-500 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 my-6">
              <p className="text-sm text-slate-300">
                أنت على وشك حذف المشروع:
                <span className="block font-bold text-white mt-1 p-2 bg-slate-900 rounded border border-slate-800">
                  {projectToDelete.header.name}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                سيتم حذف جميع بيانات المشروع، بما في ذلك بنود الحصر، المرفقات، حسابات الموردين والصناعية، والدفعات نهائياً.
              </p>

              <div>
                <label className="block text-right text-xs font-semibold text-slate-400 mb-1.5">
                  يرجى كتابة اسم المشروع لتأكيد الحذف:
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="اكتب اسم المشروع هنا..."
                  className="w-full rounded-lg border border-rose-900/30 bg-rose-950/10 px-4 py-2.5 text-right text-sm text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setProjectToDelete(null); setDeleteInput(''); }}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-400 hover:text-white transition"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting || deleteInput !== projectToDelete.header.name}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-900/20"
              >
                {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
