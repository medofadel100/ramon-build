import React from 'react';
import Link from 'next/link';
import { Store, ArrowUpRight } from 'lucide-react';
import MaterialsMarketplacePage from '@/app/materials/page';

export default function ProjectMaterialsMarketTab() {
  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Store className="w-5 h-5 text-cyan-400" />
            سوق الخامات والأسعار المباشرة
          </h2>
          <p className="text-sm text-muted-foreground mt-1">تصفح الأسعار المحدثة من المتاجر واربطها ببنود المشروع مباشرة (قريباً).</p>
        </div>
        <Link 
          href="/materials" 
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors font-medium text-sm"
        >
          فتح السوق في نافذة مستقلة
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
      
      {/* Render the full marketplace directly here but wrap it to isolate styles if needed, or simply render the component */}
      <div className="border border-border rounded-xl overflow-hidden relative" style={{ height: '800px' }}>
        <iframe src="/materials" className="w-full h-full border-0" title="Materials Marketplace" />
      </div>
    </div>
  );
}
