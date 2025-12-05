'use client';
import { useState } from 'react';
import { AuthService } from '@/lib/services/auth.service';
import { useToast } from '@/components/ui/ToastProvider';
import { Loader2, FileText, Check } from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';

export default function OnboardingDocuments({ userId, onNext }: { userId: string, onNext: () => void }) {
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const REQUIRED = [
    { key: 'drivers_license', label: "Driver's License" },
    { key: 'vehicle_insurance', label: "Vehicle Insurance" },
    { key: 'road_worthiness', label: "Road Worthiness Cert" },
    { key: 'national_id_card', label: "National ID Card" }
  ];

  const handleUpload = async (key: string, url: string) => {
    // Optimistic update
    setUploads(prev => ({ ...prev, [key]: url }));
    
    try {
      // Use the key as the document_type
      const { error } = await AuthService.uploadComplianceDoc(userId, key, url);
      if (error) {
        throw error;
      }
      addToast(`${key.replace(/_/g, ' ')} uploaded successfully`, 'success');
    } catch (err: any) {
      addToast(`Failed to save ${key.replace(/_/g, ' ')}: ${err.message}`, 'error');
      // Revert optimistic update on error 
      setUploads(prev => { 
          const newUploads = {...prev}; 
          delete newUploads[key]; 
          return newUploads; 
      }); 
    }
  };

  const handleComplete = async () => { 
    if (REQUIRED.some(r => !uploads[r.key])) {
      addToast('Please upload all required documents', 'error');
      return;
    }
    if (!consent) {
      addToast('You must consent to the background check', 'error');
      return;
    }
    
    setLoading(true);
    // Simulate final submission delay
    await new Promise(resolve => setTimeout(resolve, 500)); 
    setLoading(false);
    onNext(); 
  };

  return (
    <div className="space-y-6">
       <div className="text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8"/></div>
          <h2 className="text-2xl font-bold text-slate-900">Compliance Documents</h2>
          <p className="text-slate-500 text-sm mt-2">Required by regulatory authorities.</p>
       </div>

       <div className="space-y-3">
          {REQUIRED.map((doc) => (
             <div key={doc.key} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="flex-1">
                   <p className="font-bold text-slate-900 text-sm">{doc.label}</p>
                   <p className="text-xs text-slate-500 mt-0.5">
                     {uploads[doc.key] ? (
                       <span className="text-green-600 font-bold flex items-center gap-1"><Check className="w-3 h-3"/> Uploaded</span>
                     ) : (
                       'Clear photo required'
                     )}
                   </p>
                </div>
                {/* Fixed width container for the button */}
                <div className="w-16 h-12 shrink-0"> 
                   <ImageUpload 
                     uid={userId} 
                     type="document"
                     variant="compact" // Use compact mode
                     className="h-full w-full"
                     onUpload={(url) => handleUpload(doc.key, url)} 
                     url={uploads[doc.key]}
                   />
                </div>
             </div>
          ))}
       </div>

       <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
             <input type="checkbox" className="mt-1 w-4 h-4 accent-blue-600" checked={consent} onChange={e => setConsent(e.target.checked)} />
             <div className="text-xs text-blue-900 leading-relaxed">
                <strong>Background Check Consent:</strong> I authorize Veluxeride to conduct a criminal background check and verify my documents with relevant government agencies (FRSC/NIMC).
             </div>
          </div>
       </div>

       <button onClick={handleComplete} disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Submit Application'}
       </button>
    </div>
  );
}