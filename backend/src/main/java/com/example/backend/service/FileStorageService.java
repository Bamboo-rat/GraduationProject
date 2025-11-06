package com.example.backend.service;

import com.example.backend.entity.enums.StorageBucket;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service for handling file uploads to Cloudinary Storage
 */
public interface FileStorageService {
    
    /**
     * Upload a single file to specified folder
     * 
     * @param multipartFile File to upload
     * @param bucket Target storage folder
     * @return Public URL of uploaded file
     */
    String uploadFile(MultipartFile multipartFile, StorageBucket bucket);
    
    /**
     * Upload multiple files to specified folder
     * 
     * @param files List of files to upload
     * @param bucket Target storage folder
     * @return List of public URLs
     */
    List<String> uploadFiles(List<MultipartFile> files, StorageBucket bucket);
    
    /**
     * Delete a file from storage
     * 
     * @param fileUrl Full URL or file identifier to delete (Cloudinary URL)
     * @param bucket Source storage folder
     * @return true if deleted successfully
     */
    boolean deleteFile(String fileUrl, StorageBucket bucket);
    
    /**
     * Get public URL for a file
     * Note: With Cloudinary, upload already returns the full URL,
     * so this method is mainly for backward compatibility
     *
     * @param fileName Name of file or URL
     * @param bucket Source storage folder
     * @return Public URL
     */
    String getFileUrl(String fileName, StorageBucket bucket);

    /**
     * Generate a signed URL for accessing private/authenticated files
     * This creates a temporary URL that can access files even if they are private
     *
     * @param fileUrl The original file URL from Cloudinary
     * @param expirationSeconds Time in seconds until the URL expires (default: 7200 = 2 hours)
     * @return Signed URL that can access the file temporarily
     */
    String generateSignedUrl(String fileUrl, int expirationSeconds);
}
