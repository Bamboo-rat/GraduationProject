import { useEffect, useCallback } from 'react';

const STORAGE_KEY = 'supplier_registration_draft';
const MAX_AGE_HOURS = 24; // Draft expires after 24 hours

export interface RegistrationDraft {
  currentStep: number;
  supplierId: string;
  step1Data: {
    username: string;
    email: string;
    phoneNumber: string;
    password: string;
    fullName: string;
  };
  step3Data: {
    businessLicense: string;
    businessLicenseUrl: string;
    foodSafetyCertificate: string;
    foodSafetyCertificateUrl: string;
    avatarUrl?: string;
  };
  step4Data: {
    businessName: string;
    businessType: string; // Will be cast to BusinessType when restored
    taxCode: string;
    businessAddress: string;
    province: string;
    district: string;
    ward: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    storeName: string;
    storeAddress: string;
    storeProvince: string;
    storeDistrict: string;
    storeWard: string;
    email?: string;
    storeStreet?: string;
    storePhoneNumber?: string;
    latitude?: string;
    longitude?: string;
    storeDescription?: string;
  };
  uploadedFiles?: {
    license?: string;
    certificate?: string;
    avatar?: string;
  };
  lastSaved: string;
}

/**
 * Hook to persist registration progress in localStorage
 * Auto-saves on every data change and provides restore functionality
 */
export const useRegistrationPersistence = () => {
  /**
   * Save draft to localStorage
   */
  const saveDraft = useCallback((draft: Partial<RegistrationDraft>) => {
    try {
      const existingDraft = getDraft();
      const updatedDraft: RegistrationDraft = {
        ...(existingDraft || {} as RegistrationDraft),
        ...draft,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDraft));
    } catch (error) {
      console.error('[Registration Persistence] Failed to save draft:', error);
    }
  }, []);

  /**
   * Get draft from localStorage
   */
  const getDraft = useCallback((): RegistrationDraft | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const draft = JSON.parse(saved) as RegistrationDraft;
      
      // Check if draft is expired
      const hoursSinceLastSave = 
        (Date.now() - new Date(draft.lastSaved).getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastSave > MAX_AGE_HOURS) {
        clearDraft();
        return null;
      }

      return draft;
    } catch (error) {
      console.error('[Registration Persistence] Failed to get draft:', error);
      return null;
    }
  }, []);

  /**
   * Clear draft from localStorage
   */
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[Registration Persistence] Failed to clear draft:', error);
    }
  }, []);

  /**
   * Check if there's a valid draft available
   */
  const hasDraft = useCallback((): boolean => {
    return getDraft() !== null;
  }, [getDraft]);

  /**
   * Format last saved time for display
   */
  const getLastSavedTime = useCallback((): string | null => {
    const draft = getDraft();
    if (!draft) return null;

    const lastSaved = new Date(draft.lastSaved);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSaved.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    
    return lastSaved.toLocaleDateString('vi-VN');
  }, [getDraft]);

  return {
    saveDraft,
    getDraft,
    clearDraft,
    hasDraft,
    getLastSavedTime,
  };
};
