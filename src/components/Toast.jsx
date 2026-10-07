import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (message && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const bg = type === 'error' 
    ? 'bg-rose-50 text-rose-800 border-rose-200' 
    : type === 'info'
    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
    : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  const icon = type === 'error'
    ? <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
    : type === 'info'
    ? <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />
    : <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm w-full animate-slideUp">
      <div className={`flex items-start p-4 rounded-xl border shadow-lg ${bg}`}>
        <div className="mr-3">{icon}</div>
        <div className="flex-1 text-sm font-medium">{message}</div>
        <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
