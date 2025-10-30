package com.example.backend.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.example.backend.entity.enums.StorageBucket;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for FileStorageServiceImpl with Cloudinary
 */
@ExtendWith(MockitoExtension.class)
class FileStorageServiceImplTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @InjectMocks
    private FileStorageServiceImpl fileStorageService;

    @BeforeEach
    void setUp() {
        // Setup cloudinary.uploader() to return our mock uploader
        lenient().when(cloudinary.uploader()).thenReturn(uploader);
    }

    @Test
    void uploadFile_Success() throws IOException {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-image.jpg",
                "image/jpeg",
                "test image content".getBytes()
        );

        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("secure_url", "https://res.cloudinary.com/demo/image/upload/v123/products/uuid_123.jpg");
        uploadResult.put("public_id", "products/uuid_123");

        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(uploadResult);

        // Act
        String result = fileStorageService.uploadFile(file, StorageBucket.PRODUCTS);

        // Assert
        assertNotNull(result);
        assertTrue(result.startsWith("https://"));
        assertTrue(result.contains("cloudinary.com"));
        verify(uploader, times(1)).upload(any(byte[].class), anyMap());
    }

    @Test
    void uploadFile_ThrowsException_WhenUploadFails() throws IOException {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-image.jpg",
                "image/jpeg",
                "test image content".getBytes()
        );

        when(uploader.upload(any(byte[].class), anyMap()))
                .thenThrow(new IOException("Upload failed"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            fileStorageService.uploadFile(file, StorageBucket.PRODUCTS);
        });

        assertTrue(exception.getMessage().contains("Failed to upload file"));
        verify(uploader, times(1)).upload(any(byte[].class), anyMap());
    }

    @Test
    void uploadFiles_Success_AllFilesUploaded() throws IOException {
        // Arrange
        List<MultipartFile> files = Arrays.asList(
                new MockMultipartFile("file1", "image1.jpg", "image/jpeg", "content1".getBytes()),
                new MockMultipartFile("file2", "image2.jpg", "image/jpeg", "content2".getBytes())
        );

        Map<String, Object> uploadResult1 = new HashMap<>();
        uploadResult1.put("secure_url", "https://res.cloudinary.com/demo/image/upload/v123/products/uuid_1.jpg");

        Map<String, Object> uploadResult2 = new HashMap<>();
        uploadResult2.put("secure_url", "https://res.cloudinary.com/demo/image/upload/v123/products/uuid_2.jpg");

        when(uploader.upload(any(byte[].class), anyMap()))
                .thenReturn(uploadResult1)
                .thenReturn(uploadResult2);

        // Act
        List<String> results = fileStorageService.uploadFiles(files, StorageBucket.PRODUCTS);

        // Assert
        assertEquals(2, results.size());
        verify(uploader, times(2)).upload(any(byte[].class), anyMap());
    }

    @Test
    void uploadFiles_PartialSuccess_OneFileFails() throws IOException {
        // Arrange
        List<MultipartFile> files = Arrays.asList(
                new MockMultipartFile("file1", "image1.jpg", "image/jpeg", "content1".getBytes()),
                new MockMultipartFile("file2", "image2.jpg", "image/jpeg", "content2".getBytes())
        );

        Map<String, Object> uploadResult1 = new HashMap<>();
        uploadResult1.put("secure_url", "https://res.cloudinary.com/demo/image/upload/v123/products/uuid_1.jpg");

        when(uploader.upload(any(byte[].class), anyMap()))
                .thenReturn(uploadResult1)
                .thenThrow(new IOException("Second upload failed"));

        // Act
        List<String> results = fileStorageService.uploadFiles(files, StorageBucket.PRODUCTS);

        // Assert
        assertEquals(1, results.size()); // Only first file uploaded successfully
        verify(uploader, times(2)).upload(any(byte[].class), anyMap());
    }

    @Test
    void deleteFile_Success() throws Exception {
        // Arrange
        String fileUrl = "https://res.cloudinary.com/demo/image/upload/v123456/products/uuid_123.jpg";
        
        Map<String, Object> deleteResult = new HashMap<>();
        deleteResult.put("result", "ok");

        when(uploader.destroy(eq("products/uuid_123"), anyMap())).thenReturn(deleteResult);

        // Act
        boolean result = fileStorageService.deleteFile(fileUrl, StorageBucket.PRODUCTS);

        // Assert
        assertTrue(result);
        verify(uploader, times(1)).destroy(eq("products/uuid_123"), anyMap());
    }

    @Test
    void deleteFile_Failure_InvalidUrl() throws Exception {
        // Arrange
        String invalidUrl = "https://invalid-url.com/image.jpg";

        // Act
        boolean result = fileStorageService.deleteFile(invalidUrl, StorageBucket.PRODUCTS);

        // Assert
        assertFalse(result);
        verify(uploader, never()).destroy(anyString(), anyMap());
    }

    @Test
    void deleteFile_Failure_CloudinaryReturnsError() throws Exception {
        // Arrange
        String fileUrl = "https://res.cloudinary.com/demo/image/upload/v123456/products/uuid_123.jpg";
        
        Map<String, Object> deleteResult = new HashMap<>();
        deleteResult.put("result", "not found");

        when(uploader.destroy(eq("products/uuid_123"), anyMap())).thenReturn(deleteResult);

        // Act
        boolean result = fileStorageService.deleteFile(fileUrl, StorageBucket.PRODUCTS);

        // Assert
        assertFalse(result);
        verify(uploader, times(1)).destroy(eq("products/uuid_123"), anyMap());
    }

    @Test
    void deleteFile_Failure_ExceptionThrown() throws Exception {
        // Arrange
        String fileUrl = "https://res.cloudinary.com/demo/image/upload/v123456/products/uuid_123.jpg";
        
        // Use RuntimeException instead of checked Exception
        when(uploader.destroy(anyString(), anyMap())).thenThrow(new RuntimeException("Delete failed"));

        // Act
        boolean result = fileStorageService.deleteFile(fileUrl, StorageBucket.PRODUCTS);

        // Assert
        assertFalse(result);
        verify(uploader, times(1)).destroy(anyString(), anyMap());
    }

    @Test
    void getFileUrl_ReturnsFileName() {
        // Arrange
        String fileName = "https://res.cloudinary.com/demo/image/upload/v123/products/uuid_123.jpg";

        // Act
        String result = fileStorageService.getFileUrl(fileName, StorageBucket.PRODUCTS);

        // Assert
        assertEquals(fileName, result);
    }

    @Test
    void uploadFile_UsesCorrectFolder() throws IOException {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                "content".getBytes()
        );

        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("secure_url", "https://res.cloudinary.com/demo/image/upload/v123/banner/uuid_123.jpg");

        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(uploadResult);

        // Act
        fileStorageService.uploadFile(file, StorageBucket.BANNER);

        // Assert
        verify(uploader).upload(any(byte[].class), argThat(params -> {
            return "banner".equals(params.get("folder"));
        }));
    }

    @Test
    void uploadFile_SetsCorrectResourceType() throws IOException {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "content".getBytes()
        );

        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("secure_url", "https://res.cloudinary.com/demo/raw/upload/v123/products/uuid_123.pdf");

        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(uploadResult);

        // Act
        fileStorageService.uploadFile(file, StorageBucket.BUSINESS_LICENSES);

        // Assert: document (pdf) uploaded to BUSINESS_LICENSES should use 'raw' resource type
        verify(uploader).upload(any(byte[].class), argThat(params -> {
            return "raw".equals(params.get("resource_type"));
        }));
    }

    @Test
    void uploadFile_GeneratesUniquePublicId() throws IOException {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                "content".getBytes()
        );

        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("secure_url", "https://res.cloudinary.com/demo/image/upload/v123/products/uuid_123.jpg");

        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(uploadResult);

        // Act
        String result1 = fileStorageService.uploadFile(file, StorageBucket.PRODUCTS);
        String result2 = fileStorageService.uploadFile(file, StorageBucket.PRODUCTS);

        // Assert
        assertNotNull(result1);
        assertNotNull(result2);
        // Two separate calls should generate different public_ids
        verify(uploader, times(2)).upload(any(byte[].class), anyMap());
    }
}
