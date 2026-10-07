import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, ChevronDown, Check } from 'lucide-react';

export default function AccountSwitcher({ align = 'right' }) {
  const { accounts, selectedAccountId, setSelectedAccountId } = useFinance();
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedAccount = selectedAccountId === 'ALL' 
    ? { id: 'ALL', name: 'All Accounts' }
    : accounts.find(a => a.id === selectedAccountId) || { id: 'ALL', name: 'All Accounts' };

  const dropdownAlignClass = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between px-3 py-1.5 text-xs md:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <Wallet className="w-4 h-4 mr-1.5 text-indigo-600 flex-shrink-0" />
        <span className="truncate max-w-[110px] sm:max-w-[140px] md:max-w-[180px]">{selectedAccount.name}</span>
        <ChevronDown className="w-4 h-4 ml-1 text-slate-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/10 md:bg-transparent" onClick={() => setIsOpen(false)}></div>
          <div className={`absolute ${dropdownAlignClass} z-50 mt-2 w-56 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 animate-fadeIn`}>
            <div className="px-3.5 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-100">
              Filter by Account
            </div>
            
            <button
              onClick={() => {
                setSelectedAccountId('ALL');
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors"
            >
              <div className="flex items-center truncate mr-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2.5 flex-shrink-0"></span>
                <span className="font-medium truncate">All Accounts</span>
              </div>
              {selectedAccountId === 'ALL' && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
            </button>

            {accounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => {
                  setSelectedAccountId(acc.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors"
              >
                <div className="flex items-center truncate mr-2">
                  <span className={`w-2 h-2 rounded-full mr-2.5 flex-shrink-0 ${acc.isSystem ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                  <span className="font-medium truncate">{acc.name}</span>
                </div>
                {selectedAccountId === acc.id && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

