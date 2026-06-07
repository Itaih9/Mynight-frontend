import React from 'react';
import { Smartphone, Loader2 } from 'lucide-react';

interface VerificationButtonProps {
  onClick: (e: React.FormEvent) => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  loadingLabel?: string;
  className?: string;
}

export const VerificationButton: React.FC<VerificationButtonProps> = ({
  onClick,
  isLoading = false,
  disabled = false,
  label = "שליחת קוד אימות",
  loadingLabel = "שולח...",
  className = ""
}) => {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        group relative w-full bg-black text-white font-bold text-xl py-4 rounded-xl
        shadow-lg transition-all duration-300 overflow-hidden flex items-center justify-center gap-3
        ${disabled || isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800 active:scale-[0.98]'}
        ${className}
      `}
    >
      <style>{`
        @keyframes fly-out-up {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
        @keyframes fade-in-spinner {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fly-out {
          animation: fly-out-up 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-spinner-in {
          animation: fade-in-spinner 0.3s ease-out forwards;
        }
      `}</style>

      <span className="relative z-10 transition-colors">
        {isLoading ? loadingLabel : label}
      </span>

      <div className="relative w-6 h-6 flex items-center justify-center overflow-visible">
        {isLoading ? (
          <div className="animate-spinner-in">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <div className="transition-transform duration-300 ease-in-out group-hover:-translate-y-1.5">
            <Smartphone size={24} className={isLoading ? 'animate-fly-out' : ''} />
          </div>
        )}
      </div>
    </button>
  );
};
