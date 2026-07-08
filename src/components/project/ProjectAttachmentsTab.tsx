'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { upload } from '@vercel/blob/client';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { FileText, Image as ImageIcon, Trash2, Upload, ExternalLink, Paperclip, Eye, Download, MapPin, Plus, Check } from 'lucide-react';
import { generateId } from '@/lib/utils';

export interface Pin {
  id: string;
  x: number;
  y: number;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
  size: number;
  pins?: Pin[];
}

export default function ProjectAttachmentsTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const user = useAuthStore((state) => state.user);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const [activePin, setActivePin] = useState<Pin | null>(null);
  const [newPinCoords, setNewPinCoords] = useState<{x: number, y: number} | null>(null);
  const [newPinNote, setNewPinNote] = useState('');

  useEffect(() => {
    if (currentProject) {
      // Access files list directly from project doc if present
      const dbAttachments = (currentProject as any).attachments || [];
      setAttachments(dbAttachments);
    }
  }, [currentProject]);

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadProgress(0);

    const uniqueName = `${Date.now()}_${file.name}`;

    try {
      const newBlob = await upload(uniqueName, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        onUploadProgress: (progressEvent) => {
          setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
        }
      });
      
      const newAttachment: Attachment = {
        name: file.name,
        url: newBlob.url,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        size: file.size
      };

      const projectDocRef = doc(db, 'projects', currentProject.id);
      await updateDoc(projectDocRef, {
        attachments: arrayUnion(newAttachment)
      });

      setAttachments(prev => [...prev, newAttachment]);
      
      const storeLoad = useProjectStore.getState().loadProject;
      storeLoad(currentProject.id);

      setLoading(false);
      setUploadProgress(null);

    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(`حدث خطأ أثناء تحميل الملف: ${err.message || 'غير معروف'}`);
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!pinMode || !previewAttachment) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewPinCoords({ x, y });
    setNewPinNote('');
    setActivePin(null);
  };

  const handleSavePin = async () => {
    if (!previewAttachment || !newPinCoords || !newPinNote) return;

    const newPin: Pin = {
      id: generateId(),
      x: newPinCoords.x,
      y: newPinCoords.y,
      note: newPinNote,
      createdBy: user?.name || 'مهندس',
      createdAt: new Date().toISOString()
    };

    const updatedAttachment = {
      ...previewAttachment,
      pins: [...(previewAttachment.pins || []), newPin]
    };

    const updatedAttachments = attachments.map(a => a.url === updatedAttachment.url ? updatedAttachment : a);

    const projectDocRef = doc(db, 'projects', currentProject.id);
    await updateDoc(projectDocRef, { attachments: updatedAttachments });

    setAttachments(updatedAttachments);
    setPreviewAttachment(updatedAttachment);
    setNewPinCoords(null);
    setNewPinNote('');
  };

  const handleDeletePin = async (pinId: string) => {
    if (!previewAttachment || !canEdit) return;
    
    const updatedAttachment = {
      ...previewAttachment,
      pins: (previewAttachment.pins || []).filter(p => p.id !== pinId)
    };

    const updatedAttachments = attachments.map(a => a.url === updatedAttachment.url ? updatedAttachment : a);

    const projectDocRef = doc(db, 'projects', currentProject.id);
    await updateDoc(projectDocRef, { attachments: updatedAttachments });

    setAttachments(updatedAttachments);
    setPreviewAttachment(updatedAttachment);
    setActivePin(null);
  };

  const handleDeleteAttachment = async (att: Attachment) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المرفق؟')) return;

    try {
      const res = await fetch(`/api/upload?url=${encodeURIComponent(att.url)}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete file from storage');
      }

      const projectDocRef = doc(db, 'projects', currentProject.id);
      await updateDoc(projectDocRef, {
        attachments: arrayRemove(att)
      });

      setAttachments(prev => prev.filter(a => a.url !== att.url));
      
      const storeLoad = useProjectStore.getState().loadProject;
      storeLoad(currentProject.id);
    } catch (err) {
      console.error('Delete attachment error:', err);
      alert('خطأ أثناء حذف الملف.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 font-cairo select-none">
      
      {/* Upload Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222634] pb-4">
        <div>
          <h3 className="text-lg font-bold text-white">المرفقات والمخططات الهندسية</h3>
          <p className="text-xs text-slate-400 mt-0.5">قم بإرفاق صور الموقع، تفاصيل تشطيب المقايسة، أو الرسومات المعمارية المعتمدة.</p>
        </div>

        {canEdit && (
          <div className="relative">
            <input
              type="file"
              id="file-uploader"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
            <label
              htmlFor="file-uploader"
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#c5a880] to-[#e5c595] text-[#0d0e12] text-xs font-bold shadow hover:brightness-110 cursor-pointer transition ${
                loading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <Upload className="h-4 w-4" />
              رفع ملف جديد
            </label>
          </div>
        )}
      </div>

      {/* Upload progress bar progress */}
      {uploadProgress !== null && (
        <div className="rounded-xl border border-[#c5a880]/20 bg-[#c5a880]/5 p-4 space-y-2">
          <div className="flex justify-between text-xs font-bold text-[#c5a880]">
            <span>جاري رفع الملف في الخلفية...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#c5a880] h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Attachments list view */}
      {attachments.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#222634] rounded-2xl bg-[#13151c]/20">
          <Paperclip className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-semibold">لا يوجد أي ملفات مرفقة بهذا المشروع</p>
          <p className="text-xs text-slate-500 mt-1">اضغط على زر الرفع لإضافة ملفات جديدة لمشاركتها.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attachments.map((att, idx) => {
            const isImage = att.type.startsWith('image/');

            return (
              <div 
                key={idx}
                className="flex items-center gap-4 rounded-xl border border-[#222634] bg-[#13151c] p-4 hover:border-slate-700 transition"
              >
                {/* Thumb icon */}
                <div className="h-12 w-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 overflow-hidden">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-6 w-6 text-[#c5a880]" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 text-right">
                  <h4 className="text-xs font-bold text-white truncate" title={att.name}>{att.name}</h4>
                  <div className="flex gap-3 text-[10px] text-slate-500 mt-1 font-semibold">
                    <span>الحجم: {formatSize(att.size)}</span>
                    <span>التاريخ: {new Date(att.uploadedAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewAttachment(att)}
                    className="p-1.5 rounded hover:bg-slate-800 text-[#c5a880] hover:text-white transition"
                    title="معاينة الملف"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="تحميل"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {canEdit && (
                    <button
                      onClick={() => handleDeleteAttachment(att)}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                      title="حذف الملف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8">
          <div className="w-full max-w-6xl h-full max-h-[90vh] flex flex-col bg-[#13151c] rounded-2xl border border-[#222634] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#222634] bg-[#1a1c24]">
              <h3 className="text-sm font-bold text-white truncate max-w-[70%]" dir="ltr">{previewAttachment.name}</h3>
              <div className="flex items-center gap-3">
                {previewAttachment.type.startsWith('image/') && canEdit && (
                  <button
                    onClick={() => setPinMode(!pinMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                      pinMode 
                        ? 'bg-amber-500 text-[#0d0e12] border-amber-500' 
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    {pinMode ? 'إلغاء وضع الملاحظات' : 'إضافة ملاحظة (Pin)'}
                  </button>
                )}
                <a
                  href={previewAttachment.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c5a880]/10 text-[#c5a880] text-xs font-bold hover:bg-[#c5a880] hover:text-[#0d0e12] transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  تحميل
                </a>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  إغلاق (X)
                </button>
              </div>
            </div>
            
            {/* Modal Body / Viewer */}
            <div className="flex-1 bg-[#0d0e12] overflow-auto flex items-center justify-center relative">
              {previewAttachment.type.startsWith('image/') ? (
                <div className="relative inline-block max-w-full max-h-full">
                  {pinMode && (
                    <div className="absolute top-4 right-4 z-50 bg-black/80 backdrop-blur text-white px-3 py-1.5 rounded-lg text-xs border border-amber-500/30 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      انقر على أي نقطة في المخطط لإضافة ملاحظة
                    </div>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={previewAttachment.url} 
                    alt={previewAttachment.name} 
                    className={`max-w-full max-h-full object-contain ${pinMode ? 'cursor-crosshair' : 'cursor-default'}`} 
                    onClick={handleImageClick}
                  />
                  
                  {previewAttachment.pins?.map(pin => (
                    <div
                      key={pin.id}
                      className="absolute group z-40"
                      style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }}
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePin(activePin?.id === pin.id ? null : pin);
                          setNewPinCoords(null);
                        }}
                        className={`text-rose-500 transition-transform ${activePin?.id === pin.id ? 'scale-125 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'hover:scale-110 drop-shadow-md'}`}
                      >
                        <MapPin className="w-8 h-8 fill-rose-500/20" />
                      </button>

                      {activePin?.id === pin.id && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                          <p className="text-xs text-white mb-2 font-bold whitespace-pre-wrap">{pin.note}</p>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-slate-800 pt-2 mt-2">
                            <span>{pin.createdBy}</span>
                            {canEdit && (
                              <button onClick={() => handleDeletePin(pin.id)} className="text-rose-400 hover:text-rose-300">حذف</button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {newPinCoords && (
                    <div 
                      className="absolute z-50"
                      style={{ left: `${newPinCoords.x}%`, top: `${newPinCoords.y}%`, transform: 'translate(-50%, -100%)' }}
                    >
                      <MapPin className="w-8 h-8 text-amber-500 fill-amber-500/20 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-slate-900 border border-amber-500/30 rounded-lg p-3 shadow-2xl animate-in fade-in zoom-in-95">
                        <textarea
                          autoFocus
                          value={newPinNote}
                          onChange={e => setNewPinNote(e.target.value)}
                          placeholder="اكتب ملاحظتك على هذا الجزء..."
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none mb-2"
                          rows={3}
                        />
                        <div className="flex justify-between gap-2">
                          <button onClick={() => setNewPinCoords(null)} className="px-3 py-1.5 rounded bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 flex-1">إلغاء</button>
                          <button onClick={handleSavePin} disabled={!newPinNote} className="px-3 py-1.5 rounded bg-amber-600 text-white text-xs font-bold hover:bg-amber-500 disabled:opacity-50 flex-1">حفظ</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : previewAttachment.type === 'application/pdf' ? (
                <iframe src={`${previewAttachment.url}#toolbar=0`} className="w-full h-full border-0 bg-white" title="PDF Preview" />
              ) : previewAttachment.name.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i) ? (
                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewAttachment.url)}`} className="w-full h-full border-0 bg-white" title="Office Preview" />
              ) : previewAttachment.name.match(/\.(dwg|dxf)$/i) ? (
                <div className="flex flex-col w-full h-full bg-white relative">
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <a href={previewAttachment.url} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-600/90 text-white text-xs font-bold hover:bg-emerald-500 shadow-md backdrop-blur-sm transition">
                      <Download className="h-4 w-4" />
                      تحميل الملف الأصلي
                    </a>
                  </div>
                  <iframe src={`https://iframe.sharecad.org/cadframe/load?url=${encodeURIComponent(previewAttachment.url)}`} className="w-full h-full border-0" title="CAD Preview" />
                </div>
              ) : (
                <div className="text-center p-8 max-w-sm">
                  <FileText className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-300 font-bold mb-2">لا يمكن معاينة هذا النوع من الملفات داخل المتصفح</p>
                  <p className="text-xs text-slate-500 mb-6">يرجى تحميل الملف لفتحه باستخدام البرنامج المناسب على جهازك.</p>
                  <a href={previewAttachment.url} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c5a880] text-[#0d0e12] text-sm font-bold hover:brightness-110 transition shadow-lg">
                    <Download className="h-4 w-4" />
                    تحميل الملف
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
