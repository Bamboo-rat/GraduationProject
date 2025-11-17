package com.example.backend.controller;

import com.cloudinary.Cloudinary;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.entity.enums.StorageBucket;
import com.example.backend.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for file upload operations
 */
@Slf4j
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File Storage", description = "Endpoints for file upload and management")
public class FileStorageController {

    private final FileStorageService fileStorageService;
    private final Cloudinary cloudinary;

    @PostMapping("/upload/business-license")
    @Operation(summary = "Upload business license", description = "Upload business license document for supplier")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadBusinessLicense(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("POST /api/files/upload/business-license - Uploading business license");
        
        String url = fileStorageService.uploadFile(file, StorageBucket.BUSINESS_LICENSES);
        
        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        response.put("fileName", file.getOriginalFilename());
        response.put("fileSize", String.valueOf(file.getSize()));
        
        return ResponseEntity.ok(ApiResponse.success("Business license uploaded successfully", response));
    }

    @PostMapping("/upload/food-safety-certificate")
    @Operation(summary = "Upload food safety certificate", description = "Upload food safety certificate for supplier")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFoodSafetyCertificate(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("POST /api/files/upload/food-safety-certificate - Uploading food safety certificate");
        
        String url = fileStorageService.uploadFile(file, StorageBucket.FOOD_SAFETY_CERTIFICATES);
        
        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        response.put("fileName", file.getOriginalFilename());
        response.put("fileSize", String.valueOf(file.getSize()));
        
        return ResponseEntity.ok(ApiResponse.success("Food safety certificate uploaded successfully", response));
    }

    @PostMapping("/upload/banner")
    @Operation(summary = "Upload banner image", description = "Upload banner image for promotions")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadBanner(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("POST /api/files/upload/banner - Uploading banner");
        
        String url = fileStorageService.uploadFile(file, StorageBucket.BANNER);
        
        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        response.put("fileName", file.getOriginalFilename());
        response.put("fileSize", String.valueOf(file.getSize()));
        
        return ResponseEntity.ok(ApiResponse.success("Banner uploaded successfully", response));
    }

    @PostMapping("/upload/product")
    @Operation(summary = "Upload product image", description = "Upload product image")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProductImage(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("POST /api/files/upload/product - Uploading product image");

        String url = fileStorageService.uploadFile(file, StorageBucket.PRODUCTS);

        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        response.put("fileName", file.getOriginalFilename());
        response.put("fileSize", String.valueOf(file.getSize()));

        return ResponseEntity.ok(ApiResponse.success("Product image uploaded successfully", response));
    }

    @PostMapping("/upload/category")
    @Operation(summary = "Upload category image", description = "Upload category image for product categories")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadCategoryImage(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("POST /api/files/upload/category - Uploading category image");

        String url = fileStorageService.uploadFile(file, StorageBucket.CATEGORY_IMAGES);

        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        response.put("fileName", file.getOriginalFilename());
        response.put("fileSize", String.valueOf(file.getSize()));

        return ResponseEntity.ok(ApiResponse.success("Category image uploaded successfully", response));
    }

    @PostMapping("/upload/product/multiple")
    @Operation(summary = "Upload multiple product images", description = "Upload multiple product images at once")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadMultipleProductImages(
            @RequestParam("files") List<MultipartFile> files
    ) {
        log.info("POST /api/files/upload/product/multiple - Uploading {} product images", files.size());
        
        List<String> urls = fileStorageService.uploadFiles(files, StorageBucket.PRODUCTS);
        
        Map<String, Object> response = new HashMap<>();
        response.put("urls", urls);
        response.put("count", urls.size());
        response.put("total", files.size());
        
        return ResponseEntity.ok(ApiResponse.success(
                String.format("Uploaded %d/%d images successfully", urls.size(), files.size()), 
                response
        ));
    }

    @PostMapping("/upload/avatar")
    @Operation(summary = "Upload customer avatar", description = "Upload customer profile avatar")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadAvatar(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("POST /api/files/upload/avatar - Uploading customer avatar");
        
        String url = fileStorageService.uploadFile(file, StorageBucket.AVATAR_CUSTOMER);
        
        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        response.put("fileName", file.getOriginalFilename());
        response.put("fileSize", String.valueOf(file.getSize()));
        
        return ResponseEntity.ok(ApiResponse.success("Avatar uploaded successfully", response));
    }

    @PostMapping("/upload/avatar/admin")
    @Operation(summary = "Upload admin avatar", description = "Upload admin profile avatar")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadAdminAvatar(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("POST /api/files/upload/avatar/admin - Uploading admin avatar");
        
        String url = fileStorageService.uploadFile(file, StorageBucket.AVATAR_ADMIN);
        
        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        response.put("fileName", file.getOriginalFilename());
        response.put("fileSize", String.valueOf(file.getSize()));
        
        return ResponseEntity.ok(ApiResponse.success("Admin avatar uploaded successfully", response));
    }

    @PostMapping("/upload/supplier-logo")
    @Operation(summary = "Upload supplier logo", description = "Upload supplier business logo")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadSupplierLogo(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("POST /api/files/upload/supplier-logo - Uploading supplier logo");
        
        String url = fileStorageService.uploadFile(file, StorageBucket.SUPPLIER_LOGO);
        
        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        response.put("fileName", file.getOriginalFilename());
        response.put("fileSize", String.valueOf(file.getSize()));
        
        return ResponseEntity.ok(ApiResponse.success("Supplier logo uploaded successfully", response));
    }

    @PostMapping("/upload/store")
    @Operation(summary = "Upload store logo", description = "Upload store logo/avatar image")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadStoreLogo(
            @RequestParam("file") MultipartFile file
    ) {
        log.info("POST /api/files/upload/store - Uploading store logo");
        
        String url = fileStorageService.uploadFile(file, StorageBucket.STORE_LOGO);
        
        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        response.put("fileName", file.getOriginalFilename());
        response.put("fileSize", String.valueOf(file.getSize()));
        
        return ResponseEntity.ok(ApiResponse.success("Store logo uploaded successfully", response));
    }

    @DeleteMapping("/delete")
    @Operation(summary = "Delete file", description = "Delete a file from storage using its Cloudinary URL")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @RequestParam("fileUrl") String fileUrl,
            @RequestParam("bucket") String bucketName
    ) {
        log.info("DELETE /api/files/delete - Deleting file: {} from bucket: {}", fileUrl, bucketName);

        StorageBucket bucket;
        try {
            bucket = StorageBucket.valueOf(bucketName.toUpperCase().replace("-", "_"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid bucket name: " + bucketName));
        }

        boolean deleted = fileStorageService.deleteFile(fileUrl, bucket);

        if (deleted) {
            return ResponseEntity.ok(ApiResponse.success("File deleted successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete file"));
        }
    }

    @GetMapping("/download")
    @Operation(summary = "Download or view file with signed URL", description = "Generate signed URL or proxy Cloudinary files")
    public ResponseEntity<?> downloadFile(
            @RequestParam("url") String fileUrl,
            @RequestParam(value = "filename", required = false) String customFilename,
            @RequestParam(value = "inline", required = false, defaultValue = "false") boolean inline
    ) {
        log.info("GET /api/files/download - Processing: {}", fileUrl);

        String urlToFetch;
        try {
            urlToFetch = URLDecoder.decode(fileUrl, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            log.error("Failed to decode file URL: {}", fileUrl, e);
            return ResponseEntity.badRequest().build();
        }

        if (!urlToFetch.startsWith("http")) {
            log.error("Invalid file URL provided: {}", urlToFetch);
            return ResponseEntity.badRequest().build();
        }

        try {
            log.info("Proxying file from: {}", urlToFetch);
            
            URI uri = URI.create(urlToFetch);
            URL url = uri.toURL();
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            
            connection.setRequestMethod("GET");
            connection.setRequestProperty("User-Agent", "Mozilla/5.0");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(30000);
            connection.connect();
            
            int responseCode = connection.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                log.error("Failed to fetch file, status: {}", responseCode);
                return ResponseEntity.status(responseCode).build();
            }

            String contentType = connection.getContentType();
            if (contentType == null) {
                if (urlToFetch.toLowerCase().endsWith(".pdf")) {
                    contentType = "application/pdf";
                } else {
                    contentType = "application/octet-stream";
                }
            }

            InputStream inputStream = connection.getInputStream();
            InputStreamResource resource = new InputStreamResource(inputStream);

            String filename = customFilename;
            if (filename == null || filename.isEmpty()) {
                String[] pathParts = urlToFetch.split("/");
                filename = pathParts[pathParts.length - 1];
                int queryIndex = filename.indexOf('?');
                if (queryIndex > 0) {
                    filename = filename.substring(0, queryIndex);
                }
            }

            String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                    .replace("+", "%20");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));

            if (inline) {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + encodedFilename + "\"");
            } else {
                headers.setContentDispositionFormData("attachment", encodedFilename);
            }

            long contentLength = connection.getContentLengthLong();
            if (contentLength > 0) {
                headers.setContentLength(contentLength);
            }

            log.info("Proxying file: {} ({})", filename, contentType);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(resource);

        } catch (Exception e) {
            log.error("Error processing file: {}", fileUrl, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Extract public_id from Cloudinary URL
     * Example: https://res.cloudinary.com/dk7coitah/raw/upload/v1763106994/business-licenses/99bef529.pdf
     * Returns: business-licenses/99bef529.pdf (without version)
     */
    private String extractPublicIdFromUrl(String cloudinaryUrl) {
        try {
            // Find the upload part
            int uploadIndex = cloudinaryUrl.indexOf("/upload/");
            if (uploadIndex == -1) return null;
            
            String afterUpload = cloudinaryUrl.substring(uploadIndex + 8); // Skip "/upload/"
            
            // Remove version prefix (v1234567890/)
            if (afterUpload.startsWith("v") && afterUpload.contains("/")) {
                int firstSlash = afterUpload.indexOf("/");
                afterUpload = afterUpload.substring(firstSlash + 1);
            }
            
            // Remove query parameters
            int queryIndex = afterUpload.indexOf("?");
            if (queryIndex > 0) {
                afterUpload = afterUpload.substring(0, queryIndex);
            }
            
            return afterUpload;
        } catch (Exception e) {
            log.error("Failed to extract public_id from URL: {}", cloudinaryUrl, e);
            return null;
        }
    }
}
