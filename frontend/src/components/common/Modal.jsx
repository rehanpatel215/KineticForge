import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function Modal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-void/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-surface border border-subtle rounded-3xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        <div className="p-6 border-b border-subtle flex items-center justify-between">
          <h3 className="text-h3 text-primary font-display flex items-center gap-2">
            {type === 'danger' && <AlertTriangle className="text-danger" size={20} />}
            {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-raised rounded-lg text-tertiary hover:text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-body text-secondary leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="p-6 bg-surface-raised flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-body font-medium text-secondary hover:text-primary hover:bg-surface transition-all"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-body font-bold shadow-lg transition-all ${
              type === 'danger' 
                ? 'bg-danger text-white hover:bg-danger/90 shadow-danger/20' 
                : 'bg-accent-glow text-white hover:bg-accent-glow/90 shadow-accent-glow/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
