import axiosInstance from '../config/axios';
import type { ApiResponse } from './authService';

// Types
export type StorageBucket =
  | 'business-licenses'
  | 'food-safety-certificates'
  | 'banner'
  | 'products'
  | 'category-images'
  | 'avatar-customer'
  | 'avatar-admin'
  | 'supplier-logo';

export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: string;
}

// File Storage Service
class FileStorageService {
  /**
   * Upload file to Cloudinary storage
   */
  async uploadFile(file: File, endpoint: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axiosInstance.post<ApiResponse<UploadResponse>>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.data.url;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files: File[], endpoint: string): Promise<string[]> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axiosInstance.post<ApiResponse<{ urls: string[]; count: number; total: number }>>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data.data.urls;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload avatar for admin
   */
  async uploadAdminAvatar(file: File): Promise<string> {
    return await this.uploadFile(file, '/files/upload/avatar/admin');
  }

  /**
   * Upload avatar for customer
   */
  async uploadCustomerAvatar(file: File): Promise<string> {
    return await this.uploadFile(file, '/files/upload/avatar');
  }

  /**
   * Upload supplier logo
   */
  async uploadSupplierLogo(file: File): Promise<string> {
    return await this.uploadFile(file, '/files/upload/supplier-logo');
  }

  /**
   * Upload business license
   */
  async uploadBusinessLicense(file: File): Promise<string> {
    return await this.uploadFile(file, '/files/upload/business-license');
  }

  /**
   * Upload food safety certificate
   */
  async uploadFoodSafetyCertificate(file: File): Promise<string> {
    return await this.uploadFile(file, '/files/upload/food-safety-certificate');
  }

  /**
   * Upload product image
   */
  async uploadProductImage(file: File): Promise<string> {
    return await this.uploadFile(file, '/files/upload/product');
  }

  /**
   * Upload multiple product images
   */
  async uploadMultipleProductImages(files: File[]): Promise<string[]> {
    return await this.uploadMultipleFiles(files, '/files/upload/product/multiple');
  }

  /**
   * Upload banner image
   */
  async uploadBanner(file: File): Promise<string> {
    return await this.uploadFile(file, '/files/upload/banner');
  }

  /**
   * Upload category image
   */
  async uploadCategoryImage(file: File): Promise<string> {
    return await this.uploadFile(file, '/files/upload/category');
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileUrl: string, bucket: StorageBucket): Promise<boolean> {
    try {
      await axiosInstance.delete<ApiResponse<void>>(
        '/files/delete',
        {
          params: {
            fileUrl,
            bucket,
          },
        }
      );
      return true;
    } catch (error: any) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeMB: number = 5, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']): { valid: boolean; error?: string } {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    return new Error(error.message || 'An unexpected error occurred');
  }
}

// Export singleton instance
export default new FileStorageService();
