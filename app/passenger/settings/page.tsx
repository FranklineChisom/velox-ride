'use client';
import { User, Bell, Shield, MapPin, ChevronRight, Mail, Phone, Lock } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

      <div className="space-y-8">
        
        {/* Profile Section */}
        <section className="bg-white border border-slate-100 rounded-3xl p-6">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                 JD
              </div>
              <div>
                 <h2 className="text-xl font-bold text-slate-900">John Doe</h2>
                 <p className="text-slate-500 text-sm">Passenger</p>
              </div>
              <button className="ml-auto text-sm font-bold text-black border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50">Edit</button>
           </div>
           
           <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                 <Mail className="w-5 h-5 text-slate-400" />
                 <span className="text-sm font-medium text-slate-700">john.doe@example.com</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                 <Phone className="w-5 h-5 text-slate-400" />
                 <span className="text-sm font-medium text-slate-700">+234 801 234 5678</span>
              </div>
           </div>
        </section>

        {/* Preferences */}
        <section className="space-y-3">
           <h3 className="font-bold text-slate-900 ml-2">Preferences</h3>
           
           <button className="w-full bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:border-black/20 transition group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><MapPin className="w-5 h-5"/></div>
                 <div className="text-left">
                    <div className="font-bold text-slate-900 text-sm">Saved Places</div>
                    <div className="text-xs text-slate-500">Manage home, work, and favorites</div>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black transition" />
           </button>

           <button className="w-full bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:border-black/20 transition group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><Bell className="w-5 h-5"/></div>
                 <div className="text-left">
                    <div className="font-bold text-slate-900 text-sm">Notifications</div>
                    <div className="text-xs text-slate-500">Push, Email, and SMS settings</div>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black transition" />
           </button>

           <button className="w-full bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:border-black/20 transition group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><Shield className="w-5 h-5"/></div>
                 <div className="text-left">
                    <div className="font-bold text-slate-900 text-sm">Privacy & Safety</div>
                    <div className="text-xs text-slate-500">Trusted contacts and data</div>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black transition" />
           </button>

           <button className="w-full bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between hover:border-black/20 transition group">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Lock className="w-5 h-5"/></div>
                 <div className="text-left">
                    <div className="font-bold text-slate-900 text-sm">Security</div>
                    <div className="text-xs text-slate-500">Password and 2FA</div>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-black transition" />
           </button>
        </section>

      </div>
    </div>
  );
}