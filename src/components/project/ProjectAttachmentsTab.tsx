'use client';

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { FileText, Image, Trash2, Upload, ExternalLink, Paperclip } from 'lucide-react';

interface Attachment {
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
  size: number;
}

export default function ProjectAttachmentsTab() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const user = useAuthStore((state) => state.user);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentProject) {
      // Access files list directly from project doc if present
      // We can also fetch the project document again or read local field.
      // Let's assume we store attachments inside the projects document metadata in a field `attachments`
      const dbAttachments = (currentProject as any).attachments || [];
      setAttachments(dbAttachments);
    }
  }, [currentProject]);

  if (!currentProject) return null;

  const canEdit = user?.role === 'admin' || currentProject.header.assignedEngineers.includes(user?.uid || '');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `projects/${currentProject.id}/attachments/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.round(progress));
      },
      (error) => {
        console.error('Upload error:', error);
        alert('حدث خطأ أثناء تحميل الملف. يرجى مراجعة صلاحيات Firebase Storage.');
        setLoading(false);
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newAttachment: Attachment = {
            name: file.name,
            url: downloadURL,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            size: file.size
          };

          // Update Firestore projects doc with new attachment array element
          const projectDocRef = doc(db, 'projects', currentProject.id);
          await updateDoc(projectDocRef, {
            attachments: arrayUnion(newAttachment)
          });

          // Sync local state
          setAttachments(prev => [...prev, newAttachment]);
          
          // Trigger a local project reload in the store if needed
          const storeLoad = useProjectStore.getState().loadProject;
          storeLoad(currentProject.id);

          setLoading(false);
          setUploadProgress(null);
        } catch (err) {
          console.error('Error saving download URL:', err);
          setLoading(false);
          setUploadProgress(null);
        }
      }
    );
  };

  const handleDeleteAttachment = async (att: Attachment) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المرفق؟')) return;

    try {
      // 1. Delete from Firebase Storage
      // Extract path from download URL or use exact url (deleteObject can take the full ref URL)
      const fileRef = ref(storage, att.url);
      await deleteObject(fileRef).catch(err => {
        console.warn('Storage delete warning (could be missing/mocked):', err);
      });

      // 2. Remove from Firestore array
      const projectDocRef = doc(db, 'projects', currentProject.id);
      await updateDoc(projectDocRef, {
        attachments: arrayRemove(att)
      });

      // Sync local state
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
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="فتح الملف/تحميل"
                  >
                    <ExternalLink className="h-4 w-4" />
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

    </div>
  );
}
