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
 * Downloads a file from the given URL by fetching it and creating a blob
 * This ensures the file is actually downloaded instead of opened in browser
 *
 * @param url - The file URL to download
 * @param filename - Optional custom filename for the download
 */

export async function downloadFile(url: string, filename?: string): Promise<void> {
  if (!url) {
    console.error('No URL provided for download');
    return;
  }
  try {
    const downloadUrl = getDownloadableCloudinaryUrl(url);
 // Fetch the file
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    // Convert to blob
    const blob = await response.blob();
    // Extract filename from URL if not provided
    if (!filename) {
      const urlParts = url.split('/');
      filename = urlParts[urlParts.length - 1] || 'download';
    }
    // Create download link
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    console.log('File downloaded successfully:', filename);
  } catch (error) {
    console.error('Error downloading file:', error);
    // Fallback to window.open if fetch fails (CORS issues, etc.)
    console.log('Falling back to window.open method...');
    const downloadUrl = getDownloadableCloudinaryUrl(url);
    window.open(downloadUrl, '_blank');
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