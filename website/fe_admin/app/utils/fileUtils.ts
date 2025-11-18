/**
 * Utility functions for handling file operations with Cloudinary
 */

import axiosInstance from '~/config/axios';
import axios from 'axios';

// Get base URL from environment or use default
const API_BASE_URL: string = typeof window !== 'undefined'
  ? window.location.origin
  : 'http://localhost:8080';

// Create a separate axios instance WITHOUT authentication for public file downloads
// This prevents 401 errors when tokens are expired/invalid
const publicAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Adds the fl_attachment flag to Cloudinary URL to force download
 * This ensures that when users click on document links, the file is downloaded
 * instead of being displayed inline in the browser
 *
 * @param url - The original Cloudinary URL
 * @returns Modified URL with fl_attachment flag for download
 */

export function getDownloadableCloudinaryUrl(url: string): string {
  if (!url) return url;
  try {
    // Only process Cloudinary URLs
    if (!url.includes('res.cloudinary.com')) {
      return url;
    }
    // Check if it's already has fl_attachment
    if (url.includes('fl_attachment')) {
      return url;
    }

    if (url.includes('/raw/upload/')) {
      // Insert fl_attachment after /upload/
      return url.replace('/raw/upload/', '/raw/upload/fl_attachment/');
    }

    // For image resources that should be downloaded
    if (url.includes('/image/upload/')) {
      // Insert fl_attachment after /upload/
      return url.replace('/image/upload/', '/image/upload/fl_attachment/');
    }
    return url;
  } catch (error) {
    console.error('Error processing Cloudinary URL:', error);
    return url;
  }
}

/**
 * Downloads a file through backend proxy to avoid CORS and auth issues
 * The backend fetches from Cloudinary and streams it back with proper headers
 * Uses publicAxios (no auth) since /api/files/** endpoint is public
 *
 * @param url - The Cloudinary file URL to download
 * @param filename - Optional custom filename for the download
 */
export async function downloadFile(url: string, filename?: string): Promise<void> {
  if (!url) {
    throw new Error('No URL provided for download');
  }

  try {

    const encodedUrl = encodeURIComponent(url);
    let downloadUrl = `/api/files/download?url=${encodedUrl}`;

    if (filename) {
      const encodedFilename = encodeURIComponent(filename);
      downloadUrl += `&filename=${encodedFilename}`;
    }

    const response = await publicAxios.get(downloadUrl, {
      responseType: 'blob',
    });

    // Get the blob from response
    const blob = response.data;

    // Create blob URL
    const blobUrl = URL.createObjectURL(blob);

    // Create hidden anchor and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.style.display = 'none';

    // Extract filename from Content-Disposition header or use provided filename
    let finalFilename = filename;
    if (!finalFilename) {
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          const matchedName = filenameMatch[1].replace(/['"]/g, '');
          try {
            finalFilename = decodeURIComponent(matchedName);
          } catch {
            finalFilename = matchedName;
          }
        }
      }
    }

    if (finalFilename) {
      link.download = finalFilename;
    }

    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 100);
  } catch (error: any) {
    // Error is already handled by axios interceptor
    const errorMessage = error.response?.data?.message 
      || error.message 
      || 'Tải file thất bại';
    throw new Error(errorMessage);
  }
}

/**
 * Fetches a file (image or PDF) through the backend proxy and returns a blob URL
 * Used for displaying files in components with authentication
 * Uses publicAxios (no auth) since /api/files/** endpoint is public
 * Renamed from fetchImageAsBlobUrl to support both images and PDFs
 *
 * @param url - The Cloudinary file URL to fetch
 * @returns Promise with blob URL or null if failed
 */
export async function fetchFileAsBlobUrl(url: string): Promise<string | null> {
  if (!url) {
    return null;
  }

  try {
    const encodedUrl = encodeURIComponent(url);
    const fetchUrl = `/api/files/download?url=${encodedUrl}&inline=true`;

    // Use publicAxios (no auth headers) since this is a public endpoint
    // This prevents 401 errors when admin tokens are expired/invalid
    const response = await publicAxios.get(fetchUrl, {
      responseType: 'blob',
    });

    // Get the blob from response
    const blob = response.data;

    // Create and return blob URL
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
  } catch (error) {
    return null;
  }
}

/**
 * @deprecated Use fetchFileAsBlobUrl instead
 * Legacy alias for backward compatibility
 */
export const fetchImageAsBlobUrl = fetchFileAsBlobUrl;