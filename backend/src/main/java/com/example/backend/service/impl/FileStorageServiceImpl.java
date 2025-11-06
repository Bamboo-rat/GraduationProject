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
        String originalFilename = multipartFile.getOriginalFilename();
        long fileSize = multipartFile.getSize();
        String contentType = multipartFile.getContentType();

        log.info("=== Starting file upload ===");
        log.info("File: {} | Size: {} bytes | Content-Type: {} | Bucket: {}",
                originalFilename, fileSize, contentType, bucket.getFolderName());

        try {
            // Generate unique public ID
            String publicId = UUID.randomUUID().toString() + "_" + System.currentTimeMillis();

            // Determine resource type based on file extension and bucket type
            String resourceType = determineResourceType(originalFilename, bucket);
            log.info("✓ Resource type determined: '{}' for file: '{}'", resourceType, originalFilename);

            // Upload to Cloudinary with PUBLIC access (unsigned mode)
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder", bucket.getFolderName(),
                    "public_id", publicId,
                    "resource_type", resourceType, // Explicitly set resource type based on file
                    "overwrite", false,
                    "invalidate", true
            );

            log.info("Uploading to Cloudinary with params: folder={}, resource_type={}",
                    bucket.getFolderName(), resourceType);

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(multipartFile.getBytes(), uploadParams);

            // Get secure URL (HTTPS) - publicly accessible
            String secureUrl = (String) uploadResult.get("secure_url");
            String resultResourceType = (String) uploadResult.get("resource_type");
            String resultFormat = (String) uploadResult.get("format");

            log.info("✓ File uploaded successfully!");
            log.info("  - URL: {}", secureUrl);
            log.info("  - Resource Type: {}", resultResourceType);
            log.info("  - Format: {}", resultFormat);
            log.info("=== Upload complete ===");

            // Verify the URL contains the correct resource type
            if (!secureUrl.contains("/" + resourceType + "/upload/")) {
                log.error("⚠ WARNING: Uploaded URL does not match expected resource type!");
                log.error("  - Expected: /{}/upload/", resourceType);
                log.error("  - Got URL: {}", secureUrl);
            }

            return secureUrl;

        } catch (IOException e) {
            log.error("✗ Failed to upload file to folder: {}", bucket.getFolderName(), e);
            log.error("  - File: {}", originalFilename);
            log.error("  - Error: {}", e.getMessage());
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    /**
     * Determine Cloudinary resource type based on file extension and bucket
     * - "raw" for documents (PDF, DOC, DOCX, etc.) and ALL files in document buckets
     * - "image" for images (JPG, PNG, GIF, etc.) in image buckets only
     * - "auto" for unknown types
     */
    private String determineResourceType(String filename, StorageBucket bucket) {
        if (filename == null) {
            log.warn("Filename is null, defaulting to 'raw' resource type");
            return "raw";
        }

        // Get file extension
        String extension = getFileExtension(filename).toLowerCase().trim();
        log.debug("File: {} | Extension: {} | Bucket: {}", filename, extension, bucket.getFolderName());

        // Document buckets should ALWAYS use "raw" type (for both documents and images)
        // This ensures documents are stored with proper access and not processed as images
        if (bucket == StorageBucket.BUSINESS_LICENSES ||
            bucket == StorageBucket.FOOD_SAFETY_CERTIFICATES) {

            log.info("Document bucket detected - forcing resource type to 'raw' for file: {}", filename);
            return "raw"; // ALWAYS return raw for document buckets, regardless of file type
        }

        // For non-document buckets, determine type based on extension
        // Document formats always use "raw"
        if (extension.matches("pdf|doc|docx|xls|xlsx|txt|csv|zip|rar")) {
            log.debug("Document extension detected: {} - using 'raw' resource type", extension);
            return "raw";
        }

        // Image formats use "image" for image buckets
        if (extension.matches("jpg|jpeg|png|gif|webp|bmp|svg|tiff|ico")) {
            log.debug("Image extension detected: {} - using 'image' resource type", extension);
            return "image";
        }

        // Default to auto-detect for unknown types
        log.warn("Unknown extension: {} - using 'auto' resource type", extension);
        return "auto";
    }

    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).trim();
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

            // Determine resource type from URL
            String resourceType = extractResourceTypeFromUrl(fileUrl);
            log.info("Deleting file with resource type: {} and public_id: {}", resourceType, publicId);

            // Delete from Cloudinary with correct resource type
            @SuppressWarnings("unchecked")
            Map<String, Object> deleteParams = ObjectUtils.asMap(
                    "resource_type", resourceType,
                    "invalidate", true
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, deleteParams);
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
     * Extract resource type from Cloudinary URL
     * Example URL: https://res.cloudinary.com/{cloud_name}/image/upload/... → "image"
     * Example URL: https://res.cloudinary.com/{cloud_name}/raw/upload/... → "raw"
     * Returns: "image", "raw", or "image" (default)
     */
    private String extractResourceTypeFromUrl(String url) {
        try {
            if (url.contains("/raw/upload/")) {
                return "raw";
            } else if (url.contains("/image/upload/")) {
                return "image";
            } else if (url.contains("/video/upload/")) {
                return "video";
            }
            // Default to image if not specified
            return "image";
        } catch (Exception e) {
            log.error("Error extracting resource type from URL: {}", url, e);
            return "image";
        }
    }

    /**
     * Extract public_id from Cloudinary URL
     * Example URL: https://res.cloudinary.com/{cloud_name}/image/upload/v1234567890/products/abc123.jpg
     * Returns: products/abc123
     * Example URL: https://res.cloudinary.com/{cloud_name}/raw/upload/v1234567890/business-licenses/xyz789.pdf
     * Returns: business-licenses/xyz789
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
