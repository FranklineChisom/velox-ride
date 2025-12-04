'use client';
import { useState } from 'react';
import { UserRole } from '@/types';
import { createSystemUser } from '@/app/actions';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  currentUserRole: UserRole;
}

export default function UserCreateForm({ currentUserRole }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Determine allowed roles based on hierarchy
  const allowedRoles: UserRole[] = [];
  if (currentUserRole === 'superadmin') {
    allowedRoles.push('passenger', 'driver', 'employee', 'manager', 'superadmin');
  } else if (currentUserRole === 'manager') {
    allowedRoles.push('passenger', 'driver', 'employee');
  } else if (currentUserRole === 'employee') {
    allowedRoles.push('passenger', 'driver');
  }

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setMessage(null);
    
    const result = await createSystemUser(formData);
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'User created successfully!' });
      // Reset form manually or use a ref
      const form = document.getElementById('create-user-form') as HTMLFormElement;
      form?.reset();
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-lg">
      <h3 className="font-bold text-lg mb-4">Create New User</h3>
      
      {message && (
        <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
          {message.text}
        </div>
      )}

      <form id="create-user-form" action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
          <select name="role" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-black transition">
            {allowedRoles.map(r => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
            <input name="full_name" required placeholder="John Doe" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-black transition" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
            <input name="phone" required placeholder="+234..." className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-black transition" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
          <input name="email" type="email" required placeholder="email@example.com" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-black transition" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
          <input name="password" type="password" required placeholder="••••••••" className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-200 focus:border-black transition" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition flex justify-center items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Create User'}
        </button>
      </form>
    </div>
  );
}