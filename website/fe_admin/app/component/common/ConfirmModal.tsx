interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'green' | 'red' | 'blue';
  onConfirm: () => void;
  onCancel: () => void;
  showInput?: boolean;
  inputPlaceholder?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmColor = 'green',
  onConfirm,
  onCancel,
  showInput = false,
  inputPlaceholder = '',
  inputValue = '',
  onInputChange,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colorClasses = {
    green: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    red: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  };

  const iconColors = {
    green: 'text-green-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
  };

  const icons = {
    green: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    red: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    blue: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="fixed inset-0 backdrop-brightness-90 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl transform transition-all animate-scaleIn border border-gray-200">
        <div className="p-8">
          <div className={`mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 ${iconColors[confirmColor]} bg-opacity-10 shadow-lg`}>
            {icons[confirmColor]}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 text-center mb-6">
            {message}
          </p>

          {showInput && (
            <div className="mb-6">
              <textarea
                value={inputValue}
                onChange={(e) => onInputChange?.(e.target.value)}
                placeholder={inputPlaceholder}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                rows={3}
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={showInput && !inputValue.trim()}
              className={`flex-1 px-6 py-3 ${colorClasses[confirmColor]} text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
