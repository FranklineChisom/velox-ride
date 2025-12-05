import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'black' | 'white' | 'blue' | 'green';
}

export default function StatCard({ label, value, subValue, icon: Icon, trend, color = 'white' }: StatCardProps) {
  const isDark = color === 'black';
  const isBlue = color === 'blue';
  const isGreen = color === 'green';

  const bgClass = isDark ? 'bg-black text-white' : 
                  isBlue ? 'bg-blue-600 text-white' :
                  isGreen ? 'bg-green-600 text-white' :
                  'bg-white text-slate-900 border border-slate-100';

  const iconBg = isDark || isBlue || isGreen ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-500';
  const labelColor = isDark || isBlue || isGreen ? 'text-slate-300' : 'text-slate-500';

  return (
    <div className={`p-6 rounded-[1.5rem] shadow-sm relative overflow-hidden transition-all hover:shadow-md ${bgClass}`}>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <p className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>{label}</p>
          <div className={`p-2 rounded-xl ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <h3 className="text-3xl font-bold tracking-tight mb-1">{value}</h3>
        {subValue && <p className={`text-sm font-medium opacity-80`}>{subValue}</p>}
      </div>
      
      {/* Decorative Blur */}
      {(isDark || isBlue || isGreen) && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      )}
    </div>
  );
}