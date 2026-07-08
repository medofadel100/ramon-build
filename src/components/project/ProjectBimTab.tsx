'use client';

import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import { UploadCloud, Box, AlertTriangle, Layers } from 'lucide-react';

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function ProjectBimTab() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      alert('عذراً، النظام يدعم حالياً ملفات بصيغة GLB و GLTF فقط لعرض الموديلات 3D السريعة.');
      return;
    }

    setIsLoading(true);
    // Create a local URL for the uploaded file
    const objectUrl = URL.createObjectURL(file);
    setModelUrl(objectUrl);
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-cairo h-[calc(100vh-200px)] flex flex-col">
      
      <div className="flex justify-between items-end border-b border-border pb-4 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Box className="h-5 w-5 text-indigo-400" />
            تكامل وتصور النماذج (Light BIM Viewer)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">ارفع مجسمات 3D الخفيفة (.glb / .gltf) لمعاينة تفاصيل المشروع.</p>
        </div>
        
        <div className="relative">
          <input 
            type="file" 
            accept=".glb,.gltf" 
            onChange={handleFileUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-foreground text-xs font-bold hover:bg-indigo-500 transition shadow">
            <UploadCloud className="w-4 h-4" />
            رفع مجسم جديد
          </button>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden relative">
        {!modelUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
            <Layers className="w-16 h-16 mb-4 text-slate-700" />
            <h4 className="text-sm font-bold text-muted-foreground mb-2">لا يوجد مجسم مرفوع حالياً</h4>
            <p className="text-xs max-w-sm">قم برفع مجسم بصيغة `GLB` لعرضه بشكل تفاعلي بالكامل 360 درجة وتقريبه وتدويره داخل النظام مباشرة.</p>
          </div>
        ) : (
          <div className="w-full h-full relative bg-background/50">
            <div className="absolute top-4 left-4 z-10 bg-muted/80 backdrop-blur border border-border p-3 rounded-lg flex items-start gap-3 shadow-xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-foreground mb-1">تلميحات العرض:</h5>
                <ul className="text-[10px] text-muted-foreground space-y-1">
                  <li>• كليك يسار + سحب: تدوير المجسم (Orbit)</li>
                  <li>• كليك يمين + سحب: تحريك الكاميرا (Pan)</li>
                  <li>• البكرة: تكبير وتصغير (Zoom)</li>
                </ul>
              </div>
            </div>

            <Canvas shadows camera={{ position: [0, 0, 10], fov: 50 }}>
              <color attach="background" args={['#0f111a']} />
              <Suspense fallback={null}>
                <Stage environment="city" intensity={0.5}>
                  <Model url={modelUrl} />
                </Stage>
              </Suspense>
              <OrbitControls makeDefault />
            </Canvas>
          </div>
        )}
      </div>

    </div>
  );
}
