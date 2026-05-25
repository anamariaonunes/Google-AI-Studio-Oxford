import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}

export default function NewBatchModal({ isOpen, onClose, onCreate }: NewBatchModalProps) {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreate(title.trim());
      setTitle('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="modal-backdrop">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden"
        id="new-batch-modal-container"
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 border border-blue-100 rounded text-blue-600">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Create Briefing Batch</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-1.5 rounded-full transition-all cursor-pointer"
            id="close-modal-x"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Batch Title or Briefing Session Description
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Strategy Review, APAC Q2 Renewal"
              className="w-full border border-slate-250 rounded-lg px-3 py-2.5 text-sm outline-hidden focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-sans text-slate-850 bg-slate-50/30"
              id="input-batch-title"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Organize multiple documents (PDFs and PPTX decks) under this single briefing batch for a integrated strategic analysis.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
              id="btn-cancel-new-batch"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-blue-950 bg-linear-to-r from-blue-100 to-sky-100 border border-blue-200 hover:from-blue-200 hover:to-sky-200 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-blue-100 cursor-pointer"
              id="btn-submit-new-batch"
            >
              Create & Proceed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
