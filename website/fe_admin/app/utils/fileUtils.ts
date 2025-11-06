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
 *
 * @param url - The Cloudinary file URL to download
 * @param filename - Optional custom filename for the download
 */
export function downloadFile(url: string, filename?: string): void {
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

    console.log('Initiating download through proxy:', downloadUrl);

    // Create hidden anchor and trigger click
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.style.display = 'none';

    // Download attribute helps suggest filename to browser
    if (filename) {
      link.download = filename;
    }

    document.body.appendChild(link);
    link.click();

    // Cleanup after a short delay
    setTimeout(() => {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
    }, 100);

    console.log('Download initiated successfully');
  } catch (error) {
    console.error('Error initiating download:', error);
  }
}

/**
 * Opens file for viewing in new tab through backend proxy
 * Uses inline disposition so file displays in browser instead of downloading
 *
 * @param url - The Cloudinary file URL to view
 */
export function viewFile(url: string): void {
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

    // Open in new tab
    window.open(viewUrl, '_blank');
  } catch (error) {
    console.error('Error viewing file:', error);
  }
}