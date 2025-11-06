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
 * Downloads a file by creating a hidden anchor element with the download URL
 * Uses Cloudinary's fl_attachment flag which sets Content-Disposition header
 * This must be synchronous to avoid popup blockers
 *
 * @param url - The file URL to download
 * @param filename - Optional custom filename for the download
 */
export function downloadFile(url: string, filename?: string): void {
  if (!url) {
    console.error('No URL provided for download');
    return;
  }

  try {
    // Add fl_attachment to force download via Content-Disposition header
    const downloadUrl = getDownloadableCloudinaryUrl(url);

    console.log('Initiating download from:', downloadUrl);

    // Create a hidden anchor element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.style.display = 'none';

    // Set download attribute if filename provided
    if (filename) {
      link.download = filename;
    }

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();

    // Small delay before cleanup
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);

    console.log('Download initiated');
  } catch (error) {
    console.error('Error initiating download:', error);
  }
}

/**
 * Simple method to open file in new tab (for viewing)
 *
 * @param url - The file URL to view
 */
export function viewFile(url: string): void {
  if (!url) {
    console.error('No URL provided for viewing');
    return;
  }
  window.open(url, '_blank');
}