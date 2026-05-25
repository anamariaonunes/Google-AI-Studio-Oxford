import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title }: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="delete-modal-backdrop">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden"
        id="confirm-delete-modal-container"
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 rounded text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Confirm Deletion</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-250/50 p-1.5 rounded-full transition-all cursor-pointer"
            id="close-delete-modal-x"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Warning: Irreversible Action
            </p>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              Are you sure you want to permanently delete the briefing batch <strong className="text-slate-900">"{title}"</strong> and all its extracted assets?
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This will erase all processed intelligence, key takeaways, decisions, risks, and talking points. This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all"
              id="btn-cancel-delete"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-rose-100"
              id="btn-confirm-delete"
            >
              Delete Briefing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
