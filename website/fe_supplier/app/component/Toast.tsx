import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ type, message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-[#E8FFED]',
      borderColor: 'border-[#2F855A]',
      textColor: 'text-[#2F855A]',
      iconColor: 'text-[#2F855A]',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-[#E63946]',
      textColor: 'text-[#E63946]',
      iconColor: 'text-[#E63946]',
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-orange-50',
      borderColor: 'border-[#FF6B35]',
      textColor: 'text-[#FF6B35]',
      iconColor: 'text-[#FF6B35]',
    },
    info: {
      icon: Info,
      bgColor: 'bg-[#F5EDE6]',
      borderColor: 'border-[#DDC6B6]',
      textColor: 'text-[#6B6B6B]',
      iconColor: 'text-[#A4C3A2]',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div
      className={`fixed top-6 right-6 z-50 ${bgColor} ${textColor} px-6 py-4 rounded-xl shadow-2xl border-l-4 ${borderColor} max-w-md animate-slide-in-right`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} />
        <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className={`${textColor} hover:opacity-70 transition-opacity`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;