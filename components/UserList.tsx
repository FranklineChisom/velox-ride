'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Profile, UserRole } from '@/types';
import { deleteSystemUser, verifyDriver } from '@/app/actions';
import { Trash2, Loader2, User, Shield, Briefcase, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  currentUserRole: UserRole;
}

export default function UserList({ currentUserRole }: Props) {
  const supabase = createClient();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null); // For delete or verify loading state

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // We fetch from 'profiles' table which is publicly readable via RLS policy
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  };

  const handleDelete = async (userId: string, targetRole: UserRole) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    if (currentUserRole === 'manager' && (targetRole === 'superadmin' || targetRole === 'manager')) {
      alert("You don't have permission to delete this user.");
      return;
    }

    setProcessing(userId);
    const res = await deleteSystemUser(userId);
    
    if (res.error) {
      alert(res.error);
    } else {
      setUsers(users.filter(u => u.id !== userId));
    }
    setProcessing(null);
  };

  const handleVerify = async (userId: string) => {
    setProcessing(userId);
    const res = await verifyDriver(userId);
    
    if (res.error) {
      alert(res.error);
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, is_verified: true } : u));
    }
    setProcessing(null);
  };

  if (loading) return <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></div>;

  return (
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
                {user.role === 'superadmin' ? <Shield className="w-4 h-4"/> : 
                 user.role === 'driver' ? <Briefcase className="w-4 h-4"/> : 
                 user.full_name?.[0] || <User className="w-4 h-4"/>}
              </div>
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  {user.full_name}
                  {user.role === 'driver' && (
                    user.is_verified ? 
                      <span className="text-green-600" title="Verified Driver"><CheckCircle className="w-3 h-3 fill-current"/></span> :
                      <span className="text-orange-500" title="Pending Verification"><AlertTriangle className="w-3 h-3 fill-current"/></span>
                  )}
                </div>
                <div className="text-xs text-slate-500">{user.email} • <span className="capitalize font-semibold">{user.role}</span></div>
                
                {/* Driver Details Preview (if unverified) */}
                {user.role === 'driver' && !user.is_verified && user.vehicle_model && (
                   <div className="text-[10px] text-slate-400 mt-1 bg-slate-100 px-2 py-1 rounded inline-block">
                      Waitlist: {user.vehicle_model} ({user.vehicle_plate})
                   </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Verify Button (Only for Drivers who are not yet verified) */}
              {user.role === 'driver' && !user.is_verified && (
                <button
                  onClick={() => handleVerify(user.id)}
                  disabled={processing === user.id}
                  className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-200 transition flex items-center gap-1 disabled:opacity-50"
                >
                  {processing === user.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <CheckCircle className="w-3 h-3"/>}
                  Verify
                </button>
              )}

              {/* Delete Button */}
              {/* Managers can delete anyone EXCEPT Superadmins and other Managers */}
              {/* Staff (Employee) generally shouldn't delete users, but if allowed, restrict to passenger/driver */}
              { (currentUserRole === 'superadmin' || 
                 (currentUserRole === 'manager' && !['superadmin', 'manager'].includes(user.role))
                ) && (
                <button 
                  onClick={() => handleDelete(user.id, user.role)}
                  disabled={processing === user.id}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Delete User"
                >
                  {processing === user.id && user.role !== 'driver' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                </button>
              )}
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="p-8 text-center text-slate-400 italic">No users found.</div>
        )}
      </div>
    </div>
  );
}