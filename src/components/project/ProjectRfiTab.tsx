'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { QCForm } from '@/lib/project-service';
import { FileQuestion, Plus, ClipboardCheck, Clock, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { generateId } from '@/lib/utils';

export default function ProjectRfiTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const updateProject = useProjectStore((state) => state.updateProject);
  const user = useAuthStore((state) => state.user);

  const [forms, setForms] = useState<QCForm[]>(currentProject?.qaqcForms || []);
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState<Partial<QCForm>>({
    type: 'RFI',
    title: '',
    description: '',
  });

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');

  const handleSaveForm = async () => {
    if (!newForm.title || !newForm.description) return;

    const form: QCForm = {
      id: generateId(),
      type: newForm.type as 'RFI' | 'IR',
      title: newForm.title,
      description: newForm.description,
      status: 'submitted',
      dateCreated: new Date().toISOString(),
      createdBy: user?.name || user?.email?.split('@')[0] || 'مهندس الموقع',
    };

    const updatedForms = [form, ...forms];
    setForms(updatedForms);
    await updateProject({ qaqcForms: updatedForms });
    
    setIsAdding(false);
    setNewForm({ type: 'RFI', title: '', description: '' });
  };

  const handleUpdateStatus = async (id: string, status: QCForm['status'], responseText?: string) => {
    const updatedForms = forms.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status,
          ...(responseText && { 
            response: responseText, 
            responseDate: new Date().toISOString(),
            responder: user?.name || 'الإدارة'
          })
        };
      }
      return f;
    });

    setForms(updatedForms);
    await updateProject({ qaqcForms: updatedForms });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-cairo">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#222634] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-amber-400" />
            طلبات الاستلام والاستفسارات (QA/QC & RFI)
          </h3>
          <p className="text-xs text-slate-400 mt-1">إرسال واستقبال طلبات استلام الأعمال (IR) والاستفسارات الهندسية (RFI).</p>
        </div>
        
        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#c5a880] text-[#0d0e12] text-xs font-bold hover:brightness-110 transition"
          >
            <Plus className="w-4 h-4" />
            إنشاء طلب جديد
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-[#13151c] border border-[#222634] p-5 rounded-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-right text-xs font-bold text-slate-400 mb-1">نوع الطلب</label>
              <select 
                value={newForm.type}
                onChange={e => setNewForm({...newForm, type: e.target.value as 'RFI' | 'IR'})}
                className="w-full bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880] focus:outline-none"
              >
                <option value="RFI">استفسار هندسي (RFI)</option>
                <option value="IR">طلب استلام أعمال (IR)</option>
              </select>
            </div>
            <div>
              <label className="block text-right text-xs font-bold text-slate-400 mb-1">عنوان الطلب</label>
              <input 
                type="text"
                placeholder="مثال: طلب اعتماد خامة السيراميك..."
                value={newForm.title}
                onChange={e => setNewForm({...newForm, title: e.target.value})}
                className="w-full bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880] focus:outline-none"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-right text-xs font-bold text-slate-400 mb-1">التفاصيل والوصف</label>
            <textarea 
              rows={4}
              placeholder="اكتب تفاصيل الاستفسار أو متطلبات الاستلام بدقة..."
              value={newForm.description}
              onChange={e => setNewForm({...newForm, description: e.target.value})}
              className="w-full bg-[#1a1c24] border border-[#222634] rounded px-3 py-2 text-xs text-white focus:border-[#c5a880] focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#222634] mt-4">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveForm}
              disabled={!newForm.title || !newForm.description}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              إرسال الطلب للاعتماد
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {forms.map((form) => (
          <div key={form.id} className="bg-[#13151c] border border-[#222634] p-5 rounded-xl shadow hover:border-[#c5a880]/30 transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                  form.type === 'RFI' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {form.type === 'RFI' ? 'RFI' : 'Inspection Request'}
                </span>
                <span className="text-xs text-slate-500">{new Date(form.dateCreated).toLocaleDateString()}</span>
              </div>
              
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded ${
                form.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                form.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                'bg-slate-800 text-slate-300'
              }`}>
                {form.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                {form.status === 'rejected' && <AlertTriangle className="w-3 h-3" />}
                {form.status === 'submitted' && <Clock className="w-3 h-3" />}
                {form.status === 'approved' ? 'تم الاعتماد' : form.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
              </div>
            </div>
            
            <h4 className="text-sm font-bold text-white mb-2">{form.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">{form.description}</p>
            
            <div className="text-[10px] text-slate-500 flex items-center gap-1 mb-4">
              بواسطة: {form.createdBy}
            </div>

            {/* Responder view if not responded yet and user is admin */}
            {form.status === 'submitted' && user?.role === 'admin' ? (
              <div className="pt-4 border-t border-[#222634] space-y-3">
                <p className="text-xs font-bold text-slate-300">رد الاستشاري / الإدارة:</p>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateStatus(form.id, 'approved', 'تم الاعتماد بمطابقة المواصفات.')} className="flex-1 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition">اعتماد (Approve)</button>
                  <button onClick={() => handleUpdateStatus(form.id, 'rejected', 'مرفوض لوجود ملاحظات يرجى مراجعتها.')} className="flex-1 py-1.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition">رفض (Reject)</button>
                </div>
              </div>
            ) : form.response ? (
              <div className={`p-3 rounded-lg border ${form.status === 'approved' ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-rose-950/20 border-rose-900/50'}`}>
                <p className="text-[10px] text-slate-500 mb-1">رد بواسطة {form.responder} في {new Date(form.responseDate!).toLocaleDateString()}:</p>
                <p className={`text-xs font-bold ${form.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'}`}>{form.response}</p>
              </div>
            ) : null}

          </div>
        ))}

        {forms.length === 0 && !isAdding && (
          <div className="col-span-1 md:col-span-2 text-center py-12">
            <ClipboardCheck className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-bold">لا توجد طلبات استلام أو استفسارات حتى الآن.</p>
          </div>
        )}
      </div>

    </div>
  );
}
