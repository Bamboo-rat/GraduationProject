/**
 * Utility functions for handling file operations with Cloudinary
 */

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

    // For raw resources (documents like PDF, DOC, etc.)
    // Add fl_attachment transformation to force download
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
 * Uses authenticated fetch to include JWT token
 *
 * @param url - The Cloudinary file URL to download
 * @param filename - Optional custom filename for the download
 */
export async function downloadFile(url: string, filename?: string): Promise<void> {
  if (!url) {
    console.error('No URL provided for download');
    return;
  }

  try {
    // Build backend proxy URL
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const encodedUrl = encodeURIComponent(url);
    let downloadUrl = `${API_BASE_URL}/files/download?url=${encodedUrl}`;

    // Add custom filename if provided
    if (filename) {
      const encodedFilename = encodeURIComponent(filename);
      downloadUrl += `&filename=${encodedFilename}`;
    }

    console.log('Initiating authenticated download through proxy:', downloadUrl);

    // Get auth token from localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No authentication token found');
      throw new Error('Authentication required');
    }

    // Fetch file with authentication
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Download request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: downloadUrl
      });
      
      // Try to get error message from response body
      let errorMessage = `Tải file thất bại (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If response is not JSON, use status text
        if (response.status === 401) {
          errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        } else if (response.status === 403) {
          errorMessage = 'Không có quyền tải file này.';
        } else if (response.status === 404) {
          errorMessage = 'File không tồn tại hoặc đã bị xóa.';
        } else if (response.status >= 500) {
          errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
        }
      }
      
      throw new Error(errorMessage);
    }

    // Get the blob from response
    const blob = await response.blob();

    // Create blob URL
    const blobUrl = URL.createObjectURL(blob);

    // Create hidden anchor and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.style.display = 'none';

    // Extract filename from Content-Disposition header or use provided filename
    let finalFilename = filename;
    if (!finalFilename) {
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          finalFilename = filenameMatch[1].replace(/['"]/g, '');
          finalFilename = decodeURIComponent(finalFilename);
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

    console.log('Download completed successfully');
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

/**
 * Opens file for viewing in new tab through backend proxy
 * Uses inline disposition so file displays in browser instead of downloading
 * Uses authenticated fetch to include JWT token
 *
 * @param url - The Cloudinary file URL to view
 */
export async function viewFile(url: string): Promise<void> {
  if (!url) {
    console.error('No URL provided for viewing');
    return;
  }

  try {
    // Build backend proxy URL with inline=true for viewing
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const encodedUrl = encodeURIComponent(url);
    const viewUrl = `${API_BASE_URL}/files/download?url=${encodedUrl}&inline=true`;

    console.log('Opening file for viewing through proxy:', viewUrl);

    // Get auth token from localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No authentication token found');
      throw new Error('Authentication required');
    }

    // Fetch file with authentication
    const response = await fetch(viewUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`View failed: ${response.status} ${response.statusText}`);
    }

    // Get the blob from response
    const blob = await response.blob();

    // Create blob URL and open in new tab
    const blobUrl = URL.createObjectURL(blob);
    const newWindow = window.open(blobUrl, '_blank');

    // Cleanup blob URL after window opens (with delay to ensure it loads)
    if (newWindow) {
      // Revoke blob URL after 1 minute to free memory
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    } else {
      // If popup was blocked, revoke immediately
      URL.revokeObjectURL(blobUrl);
      console.error('Failed to open new window - popup may be blocked');
    }

    console.log('File opened for viewing successfully');
  } catch (error) {
    console.error('Error viewing file:', error);
    throw error;
  }
}

/**
 * Fetches a file (image or PDF) through the backend proxy and returns a blob URL
 * Used for displaying files in components with authentication
 * Renamed from fetchImageAsBlobUrl to support both images and PDFs
 *
 * @param url - The Cloudinary file URL to fetch
 * @returns Promise with blob URL or null if failed
 */
export async function fetchFileAsBlobUrl(url: string): Promise<string | null> {
  if (!url) {
    console.error('No URL provided for file fetch');
    return null;
  }

  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const encodedUrl = encodeURIComponent(url);
    const fetchUrl = `${API_BASE_URL}/files/download?url=${encodedUrl}&inline=true`;

    console.log('Fetching file through proxy:', fetchUrl);

    // Get auth token from localStorage
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No authentication token found');
      return null;
    }

    // Fetch file with authentication
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error(`File fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }

    // Get the blob from response
    const blob = await response.blob();

    // Create and return blob URL
    const blobUrl = URL.createObjectURL(blob);
    console.log('File fetched successfully');
    return blobUrl;
  } catch (error) {
    console.error('Error fetching file:', error);
    return null;
  }
}

/**
 * @deprecated Use fetchFileAsBlobUrl instead
 * Legacy alias for backward compatibility
 */
export const fetchImageAsBlobUrl = fetchFileAsBlobUrl;