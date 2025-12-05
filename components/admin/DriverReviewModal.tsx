'use client';
import { useState, useEffect } from 'react';
import { AdminService } from '@/lib/services/admin.service';
import { DriverApplication } from '@/types';
import { Loader2, X, CheckCircle, Car, FileText, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import Modal from '@/components/ui/Modal';

interface Props {
  driverId: string;
  reviewerId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function DriverReviewModal({ driverId, reviewerId, onClose, onUpdate }: Props) {
  const [app, setApp] = useState<DriverApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ docId: string, docName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const fetchApp = async () => {
      const data = await AdminService.getDriverApplication(driverId);
      setApp(data);
      setLoading(false);
    };
    fetchApp();
  }, [driverId]);

  const handleApproveAll = async () => {
    if (!confirm('Are you sure you want to verify this driver? This grants them access to accept rides.')) return;
    setProcessing(true);
    const { error } = await AdminService.approveDriver(driverId, reviewerId);
    setProcessing(false);
    
    if (error) addToast('Approval failed', 'error');
    else {
      addToast('Driver verified successfully', 'success');
      onUpdate();
      onClose();
    }
  };

  const handleRejectDoc = async () => {
    if (!rejectModal || !rejectReason) return;
    setProcessing(true);
    const { error } = await AdminService.rejectDocument(rejectModal.docId, rejectReason, reviewerId);
    setProcessing(false);

    if (error) addToast('Rejection failed', 'error');
    else {
      addToast('Document rejected', 'info');
      const data = await AdminService.getDriverApplication(driverId);
      setApp(data);
      setRejectModal(null);
      setRejectReason('');
    }
  };

  if (loading) return <div className="fixed inset-0 bg-white/80 z-[2000] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin"/></div>;
  if (!app) return null;

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden">
                 {app.profile.avatar_url && <img src={app.profile.avatar_url} className="w-full h-full object-cover"/>}
              </div>
              <div>
                 <h2 className="text-xl font-bold text-slate-900">{app.profile.full_name}</h2>
                 <p className="text-sm text-slate-500">{app.profile.email} • {app.profile.phone_number}</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6"/></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
           
           {/* Vehicle */}
           <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Car className="w-5 h-5 text-blue-600"/> Vehicle Information</h3>
              {app.vehicle ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                    <div><span className="block text-slate-400 text-xs font-bold uppercase">Make</span><span className="font-bold text-slate-900">{app.vehicle.make}</span></div>
                    <div><span className="block text-slate-400 text-xs font-bold uppercase">Model</span><span className="font-bold text-slate-900">{app.vehicle.model}</span></div>
                    <div><span className="block text-slate-400 text-xs font-bold uppercase">Year</span><span className="font-bold text-slate-900">{app.vehicle.year}</span></div>
                    <div><span className="block text-slate-400 text-xs font-bold uppercase">Plate</span><span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded inline-block">{app.vehicle.plate_number}</span></div>
                 </div>
              ) : <p className="text-slate-400 italic">No vehicle details provided.</p>}
           </section>

           {/* Guarantor */}
           <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-purple-600"/> Guarantor Details</h3>
              {app.guarantor ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div><span className="block text-slate-400 text-xs font-bold uppercase">Name</span><span className="font-bold text-slate-900">{app.guarantor.full_name}</span></div>
                    <div><span className="block text-slate-400 text-xs font-bold uppercase">Phone</span><span className="font-bold text-slate-900">{app.guarantor.phone_number}</span></div>
                    <div><span className="block text-slate-400 text-xs font-bold uppercase">Relation</span><span className="font-bold text-slate-900">{app.guarantor.relationship}</span></div>
                    <div><span className="block text-slate-400 text-xs font-bold uppercase">Address</span><span className="font-bold text-slate-900">{app.guarantor.address}</span></div>
                 </div>
              ) : <p className="text-slate-400 italic">No guarantor details provided.</p>}
           </section>

           {/* Documents */}
           <section className="space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2 px-2"><FileText className="w-5 h-5"/> Documents ({app.documents.length})</h3>
              <div className="grid md:grid-cols-2 gap-4">
                 {app.documents.map(doc => (
                    <div key={doc.id} className={`bg-white p-4 rounded-xl border-2 flex flex-col gap-4 transition-all ${
                       doc.status === 'rejected' ? 'border-red-100 bg-red-50/50' : 
                       doc.status === 'verified' ? 'border-green-100 bg-green-50/50' : 
                       'border-slate-100'
                    }`}>
                       <div className="flex justify-between items-start">
                          <span className="font-bold text-sm capitalize">{doc.document_type.replace(/_/g, ' ')}</span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                             doc.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                             doc.status === 'verified' ? 'bg-green-100 text-green-700' :
                             'bg-red-100 text-red-700'
                          }`}>{doc.status}</span>
                       </div>
                       
                       <div className="h-40 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group relative">
                          <img src={doc.document_url} className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer" onClick={() => window.open(doc.document_url, '_blank')} />
                       </div>

                       {doc.status === 'rejected' && (
                          <div className="text-xs text-red-600 bg-red-100/50 p-2 rounded border border-red-100">
                             <strong>Reason:</strong> {doc.rejection_reason}
                          </div>
                       )}

                       {doc.status === 'pending' && (
                          <button 
                             onClick={() => setRejectModal({ docId: doc.id, docName: doc.document_type })}
                             className="text-xs font-bold text-red-500 hover:bg-red-50 py-2 rounded border border-red-200 transition"
                          >
                             Reject Document
                          </button>
                       )}
                    </div>
                 ))}
                 {app.documents.length === 0 && <p className="text-slate-400 italic px-2">No documents uploaded yet.</p>}
              </div>
           </section>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex gap-4">
           <button onClick={onClose} className="flex-1 py-4 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">Close</button>
           <button 
             onClick={handleApproveAll} 
             disabled={processing}
             className="flex-[2] py-4 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg"
           >
              {processing ? <Loader2 className="w-5 h-5 animate-spin"/> : <><CheckCircle className="w-5 h-5"/> Approve & Verify Driver</>}
           </button>
        </div>

        {/* Rejection Modal */}
        <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title={`Reject ${rejectModal?.docName.replace(/_/g, ' ')}`}>
           <div className="space-y-4">
              <p className="text-slate-500 text-sm">Please provide a reason for rejecting this document.</p>
              <textarea 
                 className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-500 outline-none h-32 resize-none text-sm"
                 placeholder="Reason for rejection..."
                 value={rejectReason}
                 onChange={e => setRejectReason(e.target.value)}
              />
              <button 
                 onClick={handleRejectDoc} 
                 disabled={!rejectReason || processing}
                 className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                 {processing ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Confirm Rejection'}
              </button>
           </div>
        </Modal>

      </div>
    </div>
  );
}