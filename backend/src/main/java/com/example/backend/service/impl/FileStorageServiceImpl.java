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
            String originalFilename = multipartFile.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                originalFilename = originalFilename.substring(0, originalFilename.lastIndexOf("."));
            }
            String publicId = UUID.randomUUID().toString() + "_" + System.currentTimeMillis();

            // Upload to Cloudinary
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", bucket.getFolderName(),
                    "public_id", publicId,
                    "resource_type", "auto", // auto-detect file type (image, video, raw)
                    "overwrite", false,
                    "invalidate", true
            );

            Map uploadResult = cloudinary.uploader().upload(multipartFile.getBytes(), uploadParams);
            
            // Get secure URL
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
            // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{folder}/{public_id}.{format}
            String publicId = extractPublicIdFromUrl(fileUrl, bucket);
            
            if (publicId == null) {
                log.error("Could not extract public_id from URL: {}", fileUrl);
                return false;
            }

            // Delete from Cloudinary
            Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
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
        // This method is less useful with Cloudinary since upload returns the full URL
        // But we'll keep it for compatibility
        log.warn("getFileUrl called with fileName: {} and bucket: {}. Cloudinary returns full URL on upload.", fileName, bucket.getFolderName());
        return fileName; // Return as-is if it's already a full URL
    }

    /**
     * Extract public_id from Cloudinary URL
     * Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/products/abc123_1234567890.jpg
     * Returns: products/abc123_1234567890
     */
    private String extractPublicIdFromUrl(String url, StorageBucket bucket) {
        try {
            // Split by /upload/ to get the part after it
            String[] parts = url.split("/upload/");
            if (parts.length < 2) {
                return null;
            }
            
            // Get the part after /upload/v{version}/
            String pathAfterUpload = parts[1];
            
            // Remove version number (v1234567890/)
            int versionEnd = pathAfterUpload.indexOf('/', 1);
            if (versionEnd > 0) {
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
