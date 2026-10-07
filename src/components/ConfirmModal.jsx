import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', confirmVariant = 'danger' }) {
  if (!isOpen) return null;

  const btnBg = confirmVariant === 'danger' 
    ? 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500' 
    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold">
            {confirmVariant === 'danger' && <AlertTriangle className="w-5 h-5 text-rose-500" />}
            <span>{title || 'Confirm Action'}</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 text-sm text-slate-600 leading-relaxed">
          {message}
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
