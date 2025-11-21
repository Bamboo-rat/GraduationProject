import { useEffect, useRef, useCallback } from 'react';
import { useBlocker } from 'react-router';

interface UseFormProtectionOptions<T> {
  formData: T;
  isDirty: boolean;
  storageKey: string;
  autoSaveInterval?: number; // milliseconds, default 30000 (30s)
  onRestore?: (data: T) => void;
}

/**
 * Custom hook to protect form data from accidental navigation loss
 * Features:
 * - Warns user before navigation if form has unsaved changes
 * - Auto-saves form data to localStorage every X seconds
 * - Restores form data from localStorage on mount
 */
export function useFormProtection<T>({
  formData,
  isDirty,
  storageKey,
  autoSaveInterval = 30000,
  onRestore,
}: UseFormProtectionOptions<T>) {
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef(false);

  // Block navigation if form is dirty
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Clear localStorage backup
  const clearBackup = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}_timestamp`);
    } catch (error) {
      console.error('[Form Protection] Failed to clear localStorage:', error);
    }
  }, [storageKey]);

  // Auto-save to localStorage
  const saveToLocalStorage = useCallback(() => {
    if (!isDirty) {
      clearBackup();
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
      localStorage.setItem(`${storageKey}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error('[Form Protection] Failed to save to localStorage:', error);
    }
  }, [formData, isDirty, storageKey, clearBackup]);

  // Restore from localStorage on mount (only once)
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    try {
      const savedData = localStorage.getItem(storageKey);
      const timestamp = localStorage.getItem(`${storageKey}_timestamp`);

      if (savedData && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (age < maxAge) {
          const parsed = JSON.parse(savedData);
          
          // Ask user if they want to restore
          if (!isDirty && onRestore) {
            onRestore(parsed);
            clearBackup();
          } else {
            const shouldRestore = window.confirm(
              `Phát hiện dữ liệu form chưa lưu từ ${Math.round(age / 60000)} phút trước. Bạn có muốn khôi phục?`
            );

            if (shouldRestore && onRestore) {
              onRestore(parsed);
            } else {
              clearBackup();
            }
          }
        } else {
          // Data too old, clear it
          clearBackup();
        }
      }
    } catch (error) {
      console.error('[Form Protection] Failed to restore from localStorage:', error);
      clearBackup();
    }
  }, [storageKey, onRestore, clearBackup]);

  // Auto-save interval
  useEffect(() => {
    if (isDirty) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }

      // Set new timer
      autoSaveTimerRef.current = setInterval(saveToLocalStorage, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [isDirty, autoSaveInterval, saveToLocalStorage]);

  // Warn before page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời khỏi trang?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle blocker confirm/cancel
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        'Bạn có thay đổi chưa lưu. Dữ liệu đã được tự động backup. Bạn có chắc muốn rời đi?'
      );
      
      if (confirmed) {
        // Save one last time before leaving
        saveToLocalStorage();
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, saveToLocalStorage]);

  return {
    clearBackup,
    saveToLocalStorage,
  };
}
