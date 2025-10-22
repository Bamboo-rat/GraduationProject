package com.example.backend.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.backend.entity.enums.StorageBucket;
import com.example.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Implementation of FileStorageService for Cloudinary Storage
 * Files are uploaded as PUBLIC (unsigned mode) for direct access without authentication
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {
    
    private final Cloudinary cloudinary;

    @Override
    public String uploadFile(MultipartFile multipartFile, StorageBucket bucket) {
        log.info("Uploading file to folder: {}", bucket.getFolderName());
        
        try {
            // Generate unique public ID
            String publicId = UUID.randomUUID().toString() + "_" + System.currentTimeMillis();

            // Upload to Cloudinary with PUBLIC access (unsigned mode)
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", bucket.getFolderName(),
                    "public_id", publicId,
                    "resource_type", "auto", // Auto-detect file type (image, video, raw)
                    "overwrite", false,
                    "invalidate", true
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(multipartFile.getBytes(), uploadParams);
            
            // Get secure URL (HTTPS) - publicly accessible
            String secureUrl = (String) uploadResult.get("secure_url");
            log.info("File uploaded successfully: {}", secureUrl);
            
            return secureUrl;

        } catch (IOException e) {
            log.error("Failed to upload file to folder: {}", bucket.getFolderName(), e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    @Override
    public List<String> uploadFiles(List<MultipartFile> files, StorageBucket bucket) {
        log.info("Uploading {} files to folder: {}", files.size(), bucket.getFolderName());
        
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            try {
                String url = uploadFile(file, bucket);
                urls.add(url);
            } catch (Exception e) {
                log.error("Failed to upload file: {}", file.getOriginalFilename(), e);
                // Continue with other files
            }
        }
        
        log.info("Uploaded {}/{} files successfully", urls.size(), files.size());
        return urls;
    }

    @Override
    public boolean deleteFile(String fileUrl, StorageBucket bucket) {
        log.info("Deleting file from URL: {}", fileUrl);
        
        try {
            // Extract public_id from URL
            String publicId = extractPublicIdFromUrl(fileUrl);
            
            if (publicId == null) {
                log.error("Could not extract public_id from URL: {}", fileUrl);
                return false;
            }

            // Delete from Cloudinary
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            String resultStatus = (String) result.get("result");
            
            boolean success = "ok".equals(resultStatus);
            if (success) {
                log.info("File deleted successfully: {}", publicId);
            } else {
                log.warn("File deletion returned status: {}", resultStatus);
            }
            
            return success;
            
        } catch (Exception e) {
            log.error("Failed to delete file from URL: {}", fileUrl, e);
            return false;
        }
    }

    @Override
    public String getFileUrl(String fileName, StorageBucket bucket) {
        // Cloudinary returns full URL on upload, so this is just a passthrough
        log.debug("getFileUrl called - returning fileName as-is: {}", fileName);
        return fileName;
    }

    @Override
    public String generateSignedUrl(String fileUrl, int expirationSeconds) {
        // Since files are uploaded as PUBLIC (unsigned mode),
        // they are directly accessible without signed URLs
        log.debug("Files are public, returning original URL: {}", fileUrl);
        return fileUrl;
    }

    /**
     * Extract public_id from Cloudinary URL
     * Example URL: https://res.cloudinary.com/{cloud_name}/image/upload/v1234567890/products/abc123.jpg
     * Returns: products/abc123
     */
    private String extractPublicIdFromUrl(String url) {
        try {
            // Split by /upload/ to get the part after it
            String[] parts = url.split("/upload/");
            if (parts.length < 2) {
                return null;
            }
            
            // Get the part after /upload/
            String pathAfterUpload = parts[1];
            
            // Remove version number (v1234567890/)
            if (pathAfterUpload.startsWith("v") && pathAfterUpload.contains("/")) {
                int versionEnd = pathAfterUpload.indexOf('/');
                pathAfterUpload = pathAfterUpload.substring(versionEnd + 1);
            }
            
            // Remove file extension
            int extensionIndex = pathAfterUpload.lastIndexOf('.');
            if (extensionIndex > 0) {
                pathAfterUpload = pathAfterUpload.substring(0, extensionIndex);
            }
            
            return pathAfterUpload;
            
        } catch (Exception e) {
            log.error("Error extracting public_id from URL: {}", url, e);
            return null;
        }
    }
}
