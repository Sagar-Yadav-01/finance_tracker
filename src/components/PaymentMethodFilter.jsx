import React from 'react';
import { useFinance } from '../context/FinanceContext';

export default function PaymentMethodFilter() {
  const { selectedPaymentMethod, setSelectedPaymentMethod } = useFinance();

  const options = [
    { id: 'ALL', label: 'All Methods' },
    { id: 'Cash', label: 'Cash' },
    { id: 'Bank', label: 'Bank' },
    { id: 'UPI', label: 'UPI' }
  ];

  return (
    <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
      {options.map(opt => {
        const isActive = selectedPaymentMethod === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setSelectedPaymentMethod(opt.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isActive
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
