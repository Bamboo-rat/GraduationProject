import axiosInstance from '../config/axios';
import type { ApiResponse } from './authService';

// Types
export type StorageBucket =
  | 'business-licenses'
  | 'food-safety-certificates'
  | 'banner'
  | 'products'
  | 'avatar-customer'
  | 'avatar-admin'
  | 'supplier-logo';

export interface UploadResponse {
  publicId: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  uploadedAt: string;
}

// File Storage Service
class FileStorageService {
  /**
   * Get correct endpoint for each bucket type
   */
  private getUploadEndpoint(bucket: StorageBucket): string {
    const endpoints: Record<StorageBucket, string> = {
      'business-licenses': '/files/upload/business-license',
      'food-safety-certificates': '/files/upload/food-safety-certificate',
      'banner': '/files/upload/banner',
      'products': '/files/upload/product',
      'avatar-customer': '/files/upload/avatar',
      'avatar-admin': '/files/upload/avatar/admin',
      'supplier-logo': '/files/upload/supplier-logo',
    };
    return endpoints[bucket];
  }

  /**
   * Upload file to Cloudinary storage
   */
  async uploadFile(file: File, bucket: StorageBucket): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = this.getUploadEndpoint(bucket);
      console.log(`Uploading file to ${endpoint}...`);

      const response = await axiosInstance.post<ApiResponse<any>>(
        endpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Backend returns { url, fileName, fileSize } in data
      // We need to adapt it to UploadResponse format
      const result = response.data.data;
      return {
        publicId: result.fileName || '',
        secureUrl: result.url,
        format: file.type.split('/')[1] || '',
        resourceType: file.type.split('/')[0] || 'image',
        uploadedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload avatar for admin
   */
  async uploadAdminAvatar(file: File): Promise<string> {
    const result = await this.uploadFile(file, 'avatar-admin');
    return result.secureUrl;
  }

  /**
   * Upload avatar for customer
   */
  async uploadCustomerAvatar(file: File): Promise<string> {
    const result = await this.uploadFile(file, 'avatar-customer');
    return result.secureUrl;
  }

  /**
   * Upload supplier logo
   */
  async uploadSupplierLogo(file: File): Promise<string> {
    const result = await this.uploadFile(file, 'supplier-logo');
    return result.secureUrl;
  }

  /**
   * Upload business license
   */
  async uploadBusinessLicense(file: File): Promise<string> {
    const result = await this.uploadFile(file, 'business-licenses');
    return result.secureUrl;
  }

  /**
   * Upload food safety certificate
   */
  async uploadFoodSafetyCertificate(file: File): Promise<string> {
    const result = await this.uploadFile(file, 'food-safety-certificates');
    return result.secureUrl;
  }

  /**
   * Upload product image
   */
  async uploadProductImage(file: File): Promise<string> {
    const result = await this.uploadFile(file, 'products');
    return result.secureUrl;
  }

  /**
   * Upload banner image
   */
  async uploadBanner(file: File): Promise<string> {
    const result = await this.uploadFile(file, 'banner');
    return result.secureUrl;
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
