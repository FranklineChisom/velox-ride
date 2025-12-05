import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all duration-200",
              "focus:border-black focus:ring-1 focus:ring-black placeholder:text-slate-400",
              "disabled:bg-slate-50 disabled:text-slate-500",
              icon && "pl-11",
              error && "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/10",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-600 font-medium ml-1 animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;