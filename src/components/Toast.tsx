import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-3 bg-[#0E0E14] border border-[#E50914]/40 text-[#F9F9F9] px-4 py-3 rounded-xl shadow-2xl shadow-black backdrop-blur-md">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="text-xs sm:text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-[#8E8E93] hover:text-[#F9F9F9] p-1 rounded-lg transition ml-2"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
