import { useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  const styles = {
    success: 'bg-white border-l-4 border-[#A4C3A2] text-[#2D2D2D] shadow-sm',
    error: 'bg-white border-l-4 border-[#E8B4B4] text-[#2D2D2D] shadow-sm',
    warning: 'bg-white border-l-4 border-[#E8D4B4] text-[#2D2D2D] shadow-sm',
    info: 'bg-white border-l-4 border-[#B4C8E8] text-[#2D2D2D] shadow-sm',
  };

  const iconColors = {
    success: 'text-[#A4C3A2]',
    error: 'text-[#E8B4B4]',
    warning: 'text-[#E8D4B4]',
    info: 'text-[#B4C8E8]',
  };

  const progressBarColors = {
    success: 'bg-[#A4C3A2]',
    error: 'bg-[#E8B4B4]',
    warning: 'bg-[#E8D4B4]',
    info: 'bg-[#B4C8E8]',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right max-w-sm w-full">
      <div className={`${styles[type]} rounded-r-lg p-4 flex items-start gap-3 relative overflow-hidden backdrop-blur-sm bg-white/95`}>
        {/* Progress Bar */}
        <div 
          className={`absolute bottom-0 left-0 h-0.5 ${progressBarColors[type]} animate-progress`}
          style={{ 
            animationDuration: `${duration}ms`,
            width: '100%'
          }}
        />
        
        {/* Icon */}
        <div className={`${iconColors[type]} flex-shrink-0 mt-0.5`}>
          {icons[type]}
        </div>
        
        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="font-normal text-sm leading-relaxed text-[#6B6B6B]">{message}</p>
        </div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 text-[#8B8B8B] hover:text-[#2D2D2D] transition-colors rounded-full p-1 hover:bg-[#F5EDE6]"
        >
          <X size={14} />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .animate-progress {
          animation: progress linear forwards;
        }
      `}} />
    </div>
  );
}