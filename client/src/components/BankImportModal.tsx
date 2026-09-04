import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const BankImportModal: React.FC = () => {
  const { isImportModalOpen, setIsImportModalOpen, accounts, refreshData, showNotification } = useFinance();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW'>('UPLOAD');

  if (!isImportModalOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsLoading(true);

    try {
      const res = await api.uploadStatementPreview(selected);
      if (res.success && res.data) {
        setPreviewData(res.data.transactions);
        setStep('PREVIEW');
      } else {
        showNotification(res.message || 'Failed to parse statement');
      }
    } catch {
      showNotification('Error reading statement file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommit = async () => {
    setIsLoading(true);
    try {
      const res = await api.commitStatementImport(previewData, selectedAccountId || accounts[0]?.id);
      if (res.success) {
        showNotification(res.message);
        await refreshData();
        setIsImportModalOpen(false);
      }
    } catch {
      showNotification('Error committing imported transactions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl glass-panel-elevated rounded-3xl border border-slate-700/80 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">Bank Statement CSV / Excel Import</h2>
              <p className="text-xs text-slate-400">Desktop & Electron auto-categorization wizard</p>
            </div>
          </div>
          <button
            onClick={() => setIsImportModalOpen(false)}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'UPLOAD' ? (
          <div className="py-8 space-y-6 text-center">
            
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-8 transition flex flex-col items-center justify-center bg-slate-900/40">
              <UploadCloud className="w-12 h-12 text-cyan-400 mb-3 animate-bounce" />
              <h3 className="text-sm font-semibold text-white mb-1">
                Drag & Drop or Browse Bank Statement
              </h3>
              <p className="text-xs text-slate-400 mb-4 max-w-sm">
                Supports City Bank, bKash, BRAC, Standard Chartered, or global bank (.csv, .xlsx, .xls) statements.
              </p>
              
              <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition active:scale-95">
                <span>Select File</span>
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
              </label>
            </div>

            {isLoading && (
              <p className="text-xs text-cyan-400 animate-pulse">
                Parsing rows and running smart keyword categorization...
              </p>
            )}

          </div>
        ) : (
          <div className="space-y-4 py-4">
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">
                Found <strong>{previewData.length}</strong> transactions in {file?.name}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Import to Account:</span>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="glass-input rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} className="bg-slate-900">
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview Table */}
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800 text-xs">
              {previewData.map((row) => (
                <div key={row.rowId} className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white block">{row.description}</span>
                    <span className="text-[10px] text-slate-400">{row.date} • {row.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${row.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {row.type === 'INCOME' ? '+' : '-'}৳{row.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setStep('UPLOAD')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Choose Different File
              </button>
              <button
                onClick={handleCommit}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{isLoading ? 'Importing...' : 'Confirm & Save to Database'}</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
