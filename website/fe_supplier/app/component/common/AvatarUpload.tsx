import React, { useState, useRef } from 'react';
import * as Icons from 'lucide-react';
import fileStorageService from '~/service/fileStorageService';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange: (url: string) => void;
  userName?: string;
  size?: 'small' | 'medium' | 'large';
  editable?: boolean;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  onAvatarChange,
  userName = 'User',
  size = 'large',
  editable = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20',
    large: 'w-24 h-24',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  const textSizes = {
    small: 'text-xl',
    medium: 'text-2xl',
    large: 'text-3xl',
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = fileStorageService.validateFile(file, 5, ['image/jpeg', 'image/jpg', 'image/png']);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      setIsUploading(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Cloudinary (using supplier logo endpoint)
      const url = await fileStorageService.uploadSupplierLogo(file);
      onAvatarChange(url);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (editable && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;
  const initial = userName?.charAt(0).toUpperCase() || 'S';

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} rounded-full bg-[#FFFEFA] p-1.5 shadow-xl ring-4 ring-white ${
          editable && !isUploading ? 'cursor-pointer' : ''
        } ${isUploading ? 'opacity-50' : ''}`}
        onClick={handleClick}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] flex items-center justify-center">
            <span className={`${textSizes[size]} font-bold text-white`}>
              {initial}
            </span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full">
            <Icons.Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
          </div>
        )}
      </div>

      {editable && !isUploading && (
        <button
          type="button"
          onClick={handleClick}
          className="absolute bottom-0 right-0 w-8 h-8 bg-[#2F855A] hover:bg-[#276749] text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          title="Đổi ảnh đại diện"
        >
          <Icons.Camera className="w-4 h-4" />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default AvatarUpload;
