import React, { useState, useRef } from 'react';
import { UploadCloud, Loader2, CheckCircle2, FileText, AlertCircle, Trash2, Image as ImageIcon, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { extractTransactionData } from '../lib/gemini';
import { ExtractedData } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useStore } from '../store';

interface ExtractedTransaction extends ExtractedData {
  id: string;
  saved: boolean;
  duplicateWarning: boolean;
}

interface ProcessedFile {
  id: string;
  file: File;
  status: 'processing' | 'success' | 'error' | 'saved' | 'partial_saved';
  data?: ExtractedTransaction[];
  error?: string;
  selectedCardId?: string;
}

export function OCRScanner() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { cards, transactions, addTransaction } = useStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateFileStatus = (id: string, updates: Partial<ProcessedFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFiles = async (newFiles: File[]) => {
    const newProcessedFiles = newFiles.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      status: 'processing' as const,
      selectedCardId: cards[0]?.id
    }));

    setFiles(prev => [...newProcessedFiles, ...prev]);

    for (const pf of newProcessedFiles) {
      if (!pf.file.type.startsWith('image/') && pf.file.type !== 'application/pdf') {
        updateFileStatus(pf.id, { status: 'error', error: 'Unsupported file type. Please upload images or PDFs.' });
        continue;
      }

      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          const extractedDataArray = await extractTransactionData(base64String, pf.file.type);
          
          if (extractedDataArray && extractedDataArray.length > 0) {
            const mappedData: ExtractedTransaction[] = extractedDataArray.map(data => ({
              ...data,
              id: Math.random().toString(36).substring(7),
              saved: false,
              duplicateWarning: false
            }));
            updateFileStatus(pf.id, { status: 'success', data: mappedData });
          } else {
            updateFileStatus(pf.id, { status: 'error', error: 'Could not extract data from the document. Please try a clearer version.' });
          }
        };
        reader.readAsDataURL(pf.file);
      } catch (err) {
        updateFileStatus(pf.id, { status: 'error', error: 'An error occurred during processing.' });
      }
    }
  };

  const handleSaveTransaction = (fileId: string, txId: string, forceSave: boolean = false) => {
    setFiles(prevFiles => {
      const file = prevFiles.find(f => f.id === fileId);
      if (!file || !file.data || !file.selectedCardId) return prevFiles;

      const txToSave = file.data.find(t => t.id === txId);
      if (!txToSave || txToSave.saved) return prevFiles;

      if (!forceSave) {
        const isDuplicate = transactions.some(t => {
          try {
            const isSameBasicInfo = t.description.toLowerCase() === txToSave.establishment.toLowerCase() &&
              Math.abs(t.amount - txToSave.totalValue) < 0.01 &&
              new Date(t.date).toISOString().substring(0, 10) === new Date(txToSave.date).toISOString().substring(0, 10);
              
            if (!isSameBasicInfo) return false;
            
            if (t.isInstallment && txToSave.isInstallment) {
              return t.currentInstallment === txToSave.currentInstallment;
            }
            
            return true;
          } catch (e) {
            return false;
          }
        });

        if (isDuplicate) {
          const updatedData = file.data.map(t => 
            t.id === txId ? { ...t, duplicateWarning: true } : t
          );
          return prevFiles.map(f => f.id === fileId ? { ...f, data: updatedData } : f);
        }
      }

      addTransaction({
        cardId: file.selectedCardId,
        date: new Date(txToSave.date).toISOString(),
        description: txToSave.establishment,
        amount: Number(txToSave.totalValue),
        category: txToSave.category,
        type: txToSave.type,
        isInstallment: txToSave.isInstallment,
        currentInstallment: txToSave.currentInstallment,
        totalInstallments: txToSave.totalInstallments
      });

      const updatedData = file.data.map(t => 
        t.id === txId ? { ...t, saved: true, duplicateWarning: false } : t
      );
      
      const allSaved = updatedData.every(t => t.saved);
      return prevFiles.map(f => f.id === fileId ? { ...f, data: updatedData, status: allSaved ? 'saved' : 'partial_saved' } : f);
    });
  };

  const handleSaveAll = (fileId: string) => {
    setFiles(prevFiles => {
      const file = prevFiles.find(f => f.id === fileId);
      if (!file || !file.data || !file.selectedCardId) return prevFiles;

      let anySaved = false;
      const updatedData = file.data.map(txToSave => {
        if (txToSave.saved || txToSave.duplicateWarning) return txToSave;

        const isDuplicate = transactions.some(t => {
          try {
            const isSameBasicInfo = t.description.toLowerCase() === txToSave.establishment.toLowerCase() &&
              Math.abs(t.amount - txToSave.totalValue) < 0.01 &&
              new Date(t.date).toISOString().substring(0, 10) === new Date(txToSave.date).toISOString().substring(0, 10);
              
            if (!isSameBasicInfo) return false;
            
            if (t.isInstallment && txToSave.isInstallment) {
              return t.currentInstallment === txToSave.currentInstallment;
            }
            
            return true;
          } catch (e) {
            return false;
          }
        });

        if (isDuplicate) {
          return { ...txToSave, duplicateWarning: true };
        }

        addTransaction({
          cardId: file.selectedCardId!,
          date: new Date(txToSave.date).toISOString(),
          description: txToSave.establishment,
          amount: Number(txToSave.totalValue),
          category: txToSave.category,
          type: txToSave.type,
          isInstallment: txToSave.isInstallment,
          currentInstallment: txToSave.currentInstallment,
          totalInstallments: txToSave.totalInstallments
        });

        anySaved = true;
        return { ...txToSave, saved: true, duplicateWarning: false };
      });

      if (!anySaved && updatedData.every((t, i) => t === file.data![i])) {
        return prevFiles;
      }

      const allSaved = updatedData.every(t => t.saved);
      return prevFiles.map(f => f.id === fileId ? { ...f, data: updatedData, status: allSaved ? 'saved' : 'partial_saved' } : f);
    });
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-navy-900">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Smart Scanner</h1>
        <p className="text-slate-400 mt-1">Upload receipts, invoices, or screenshots (Images & PDFs) to automatically extract transaction data.</p>
      </header>

      <div className="max-w-4xl mx-auto">
        <div
          className={cn(
            "border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 relative overflow-hidden mb-8",
            isDragging ? "border-amethyst-500 bg-amethyst-500/5" : "border-slate-700 hover:border-slate-600 bg-navy-800"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,application/pdf"
            multiple
            onChange={handleFileSelect}
          />
          
          <div className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-2 shadow-inner">
              <UploadCloud className="w-8 h-8 text-amethyst-400" />
            </div>
            <p className="text-xl font-medium text-white">Click or drag files here</p>
            <p className="text-sm text-slate-400">Supports multiple JPG, PNG, or PDF files.</p>
          </div>
        </div>

        <div className="space-y-6">
          {files.map((pf) => (
            <div key={pf.id} className={cn(
              "bg-navy-800 rounded-2xl border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500",
              pf.status === 'saved' ? "border-emerald-500/50 opacity-70" : 
              pf.status === 'partial_saved' ? "border-amethyst-500/50" : "border-slate-700/50"
            )}>
              <div className={cn(
                "p-4 border-b border-slate-700/50 flex items-center justify-between",
                pf.status === 'success' ? "bg-emerald-500/5" : 
                pf.status === 'error' ? "bg-rose-500/5" : 
                pf.status === 'saved' ? "bg-emerald-500/10" : 
                pf.status === 'partial_saved' ? "bg-amethyst-500/10" : "bg-navy-800/50"
              )}>
                <div className="flex items-center gap-3">
                  {pf.file.type === 'application/pdf' ? (
                    <FileText className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="font-medium text-slate-200 truncate max-w-[200px] sm:max-w-xs">{pf.file.name}</span>
                  
                  {pf.status === 'processing' && (
                    <span className="flex items-center gap-2 text-xs font-medium text-amethyst-400 bg-amethyst-500/10 px-2.5 py-1 rounded-full">
                      <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                    </span>
                  )}
                  {pf.status === 'success' && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Extracted ({pf.data?.length || 0})
                    </span>
                  )}
                  {pf.status === 'partial_saved' && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-amethyst-400 bg-amethyst-500/10 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Partially Saved
                    </span>
                  )}
                  {pf.status === 'saved' && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All Saved
                    </span>
                  )}
                  {pf.status === 'error' && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5" /> Failed
                    </span>
                  )}
                </div>
                
                <button 
                  onClick={() => removeFile(pf.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {pf.status === 'error' && (
                <div className="p-6">
                  <p className="text-sm text-rose-400">{pf.error}</p>
                </div>
              )}

              {(pf.status === 'success' || pf.status === 'saved' || pf.status === 'partial_saved') && pf.data && (
                <>
                  <div className="p-4 bg-navy-900/50 border-b border-slate-700/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-slate-400">Select Card for all:</label>
                      <select 
                        value={pf.selectedCardId || ''}
                        onChange={(e) => updateFileStatus(pf.id, { selectedCardId: e.target.value })}
                        className="bg-navy-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-amethyst-500 focus:border-amethyst-500 block p-2"
                      >
                        {cards.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    {pf.status !== 'saved' && (
                      <button 
                        onClick={() => handleSaveAll(pf.id)}
                        disabled={!pf.selectedCardId}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
                      >
                        Save All Non-Duplicates
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-700/50">
                    {pf.data.map((tx) => (
                      <div key={tx.id} className={cn(
                        "p-4 transition-colors",
                        tx.saved ? "bg-emerald-500/5" : "hover:bg-navy-800/80"
                      )}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                            <div className="sm:col-span-2">
                              <div className="font-medium text-white">{tx.establishment}</div>
                              <div className="text-sm text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{tx.date}</span>
                                <span>•</span>
                                <span className="capitalize">{tx.category}</span>
                                {tx.isInstallment && (
                                  <>
                                    <span>•</span>
                                    <span>{tx.currentInstallment}/{tx.totalInstallments}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-lg font-bold text-white text-left sm:text-right">
                              {formatCurrency(tx.totalValue)}
                            </div>
                            <div className="flex justify-end">
                              {tx.saved ? (
                                <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                                  <CheckCircle2 className="w-4 h-4" /> Saved
                                </span>
                              ) : (
                                <button 
                                  onClick={() => handleSaveTransaction(pf.id, tx.id, tx.duplicateWarning)}
                                  disabled={!pf.selectedCardId}
                                  className={cn(
                                    "px-4 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all",
                                    tx.duplicateWarning 
                                      ? "bg-amber-600 hover:bg-amber-500 shadow-[0_0_10px_rgba(217,119,6,0.3)]" 
                                      : "bg-amethyst-600 hover:bg-amethyst-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                  )}
                                >
                                  {tx.duplicateWarning ? 'Confirm Duplicate' : 'Save'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {tx.duplicateWarning && !tx.saved && (
                          <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-400/80">
                              A transaction with this exact description, amount, and date already exists. Are you sure you want to add it again?
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
