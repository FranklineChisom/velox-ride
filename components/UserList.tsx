'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Profile, UserRole } from '@/types';
import { deleteSystemUser, verifyDriver } from '@/app/actions';
import { Trash2, Loader2, User, Shield, Briefcase, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import DriverReviewModal from '@/components/admin/DriverReviewModal';

interface Props {
  currentUserRole: UserRole;
}

export default function UserList({ currentUserRole }: Props) {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<string | null>(null); // State for modal
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchUsers();
    supabase.auth.getUser().then(({ data }) => { if(data.user) setCurrentUserId(data.user.id); });
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  };

  const handleDelete = async (userId: string, targetRole: UserRole) => {
    if (!confirm('Are you sure? This action is permanent.')) return;
    if (currentUserRole === 'manager' && (targetRole === 'superadmin' || targetRole === 'manager')) {
      alert("Permission denied."); return;
    }
    setProcessing(userId);
    const res = await deleteSystemUser(userId);
    if (res.error) alert(res.error); else setUsers(users.filter(u => u.id !== userId));
    setProcessing(null);
  };

  if (loading) return <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div>;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">User Directory</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {users.map((user) => (
            <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0
                  ${user.role === 'superadmin' ? 'bg-red-500' : 
                    user.role === 'manager' ? 'bg-purple-500' : 
                    user.role === 'employee' ? 'bg-blue-500' : 
                    user.role === 'driver' ? 'bg-black' : 'bg-slate-400'}`}
                >
                  {user.role === 'driver' ? <Briefcase className="w-4 h-4"/> : <User className="w-4 h-4"/>}
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    {user.full_name || 'No Name'}
                    {user.role === 'driver' && (
                      user.is_verified ? 
                        <span className="text-green-600" title="Verified Driver"><CheckCircle className="w-3 h-3 fill-current"/></span> :
                        <span className="text-orange-500" title="Pending Verification"><AlertTriangle className="w-3 h-3 fill-current"/></span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{user.email} • <span className="capitalize font-semibold">{user.role}</span></div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* Review Button for Drivers */}
                {user.role === 'driver' && !user.is_verified && (
                  <button
                    onClick={() => setReviewTarget(user.id)}
                    className="bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1 shadow-sm"
                  >
                    <Eye className="w-3 h-3"/> Review
                  </button>
                )}

                {/* Delete Button */}
                { (currentUserRole === 'superadmin' || 
                   (currentUserRole === 'manager' && !['superadmin', 'manager'].includes(user.role))
                  ) && (
                  <button 
                    onClick={() => handleDelete(user.id, user.role)}
                    disabled={processing === user.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    {processing === user.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                  </button>
                )}
              </div>
            </div>
          ))}
          {users.length === 0 && <div className="p-8 text-center text-slate-400 italic">No users found.</div>}
        </div>
      </div>

      {/* Review Modal Injection */}
      {reviewTarget && (
        <DriverReviewModal 
          driverId={reviewTarget} 
          reviewerId={currentUserId}
          onClose={() => setReviewTarget(null)} 
          onUpdate={fetchUsers} 
        />
      )}
    </>
  );
}