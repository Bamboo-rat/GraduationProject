# Category Image Upload Guide

## Backend Configuration

### ✅ Completed Setup

1. **StorageBucket Enum Updated**
   - File: `/backend/src/main/java/com/example/backend/entity/enums/StorageBucket.java`
   - Added: `CATEGORY_IMAGES("category-images", "Product category images")`

2. **FileStorageController Updated**
   - File: `/backend/src/main/java/com/example/backend/controller/FileStorageController.java`
   - Added endpoint: `POST /api/files/upload/category`

3. **CLAUDE.md Updated**
   - Added `category-images` to supported buckets list

---

## API Endpoint

### Upload Category Image

**Endpoint**: `POST /api/files/upload/category`

**Content-Type**: `multipart/form-data`

**Request**:
```
Form Data:
  file: [image file]
```

**Response**:
```json
{
  "success": true,
  "message": "Category image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/dk7coitah/image/upload/v1234567890/category-images/abc123.jpg",
    "fileName": "vegetables.jpg",
    "fileSize": "245680"
  }
}
```

**Supported Image Formats**:
- JPEG/JPG
- PNG
- WEBP
- GIF

**Recommended Specifications**:
- Minimum size: 400x300px
- Recommended size: 1200x800px (will be optimized by Cloudinary)
- Max file size: 10MB (configurable in FileStorageService)
- Aspect ratio: 4:3 or 16:9

---

## Frontend Integration

### Admin Frontend (React/TypeScript)

#### 1. Create CategoryService

Create or update: `/fe_admin/app/service/categoryService.ts`

```typescript
import axiosInstance from '../config/axios';

export interface CategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  active?: boolean;
}

export interface CategoryResponse {
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  active: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const categoryService = {
  /**
   * Upload category image to Cloudinary
   */
  uploadCategoryImage: async (file: File): Promise<{ url: string; fileName: string; fileSize: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post<ApiResponse<{ url: string; fileName: string; fileSize: string }>>(
      '/files/upload/category',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  },

  /**
   * Create a new category
   */
  createCategory: async (request: CategoryRequest): Promise<CategoryResponse> => {
    const response = await axiosInstance.post<ApiResponse<CategoryResponse>>(
      '/categories',
      request
    );
    return response.data.data;
  },

  /**
   * Update category
   */
  updateCategory: async (categoryId: string, request: CategoryRequest): Promise<CategoryResponse> => {
    const response = await axiosInstance.put<ApiResponse<CategoryResponse>>(
      `/categories/${categoryId}`,
      request
    );
    return response.data.data;
  },

  /**
   * Get all categories with pagination
   */
  getAllCategories: async (
    page: number = 0,
    size: number = 20,
    active?: boolean,
    search?: string
  ): Promise<{ content: CategoryResponse[]; totalElements: number; totalPages: number }> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (active !== undefined) params.append('active', active.toString());
    if (search) params.append('search', search);

    const response = await axiosInstance.get<ApiResponse<any>>(
      `/categories?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Delete category
   */
  deleteCategory: async (categoryId: string): Promise<void> => {
    await axiosInstance.delete(`/categories/${categoryId}`);
  },

  /**
   * Toggle category active status
   */
  toggleActive: async (categoryId: string, active: boolean): Promise<CategoryResponse> => {
    const response = await axiosInstance.patch<ApiResponse<CategoryResponse>>(
      `/categories/${categoryId}/toggle-active?active=${active}`
    );
    return response.data.data;
  },
};

export default categoryService;
```

#### 2. Create Category Form Component

Create: `/fe_admin/app/pages/categories/CategoryForm.tsx`

```typescript
import React, { useState } from 'react';
import categoryService, { CategoryRequest } from '../../service/categoryService';

interface CategoryFormProps {
  onSuccess?: () => void;
  initialData?: any;
  isEdit?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ onSuccess, initialData, isEdit = false }) => {
  const [formData, setFormData] = useState<CategoryRequest>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    imageUrl: initialData?.imageUrl || '',
    active: initialData?.active ?? true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setImageFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to Cloudinary
  const handleImageUpload = async () => {
    if (!imageFile) return;

    setUploading(true);
    setError('');

    try {
      const result = await categoryService.uploadCategoryImage(imageFile);
      setFormData({ ...formData, imageUrl: result.url });
      console.log('Image uploaded successfully:', result.url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Upload image first if there's a new one
    if (imageFile && !uploading) {
      await handleImageUpload();
    }

    // Wait for image upload to complete
    if (uploading) {
      setError('Please wait for image upload to complete');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (isEdit && initialData?.categoryId) {
        await categoryService.updateCategory(initialData.categoryId, formData);
      } else {
        await categoryService.createCategory(formData);
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="category-form">
      <h2>{isEdit ? 'Edit Category' : 'Create New Category'}</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Category Name */}
      <div className="form-group">
        <label htmlFor="name">Category Name *</label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          maxLength={100}
          placeholder="e.g., Fresh Vegetables"
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          maxLength={500}
          rows={4}
          placeholder="Describe this category..."
        />
      </div>

      {/* Image Upload */}
      <div className="form-group">
        <label htmlFor="image">Category Image</label>

        {/* Image Preview */}
        {imagePreview && (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" style={{ maxWidth: '400px', maxHeight: '300px' }} />
          </div>
        )}

        {/* File Input */}
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageChange}
        />

        {/* Upload Button */}
        {imageFile && !formData.imageUrl && (
          <button
            type="button"
            onClick={handleImageUpload}
            disabled={uploading}
            className="btn-upload"
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        )}

        {formData.imageUrl && (
          <p className="text-success">✓ Image uploaded successfully</p>
        )}
      </div>

      {/* Active Status */}
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          />
          Active
        </label>
      </div>

      {/* Submit Button */}
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
      </button>
    </form>
  );
};

export default CategoryForm;
```

---

## Usage Example

### Create Category with Image

```bash
# Step 1: Upload image
curl -X POST http://localhost:8080/api/files/upload/category \
  -H "Authorization: Bearer {admin_token}" \
  -F "file=@vegetables.jpg"

# Response:
{
  "success": true,
  "message": "Category image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/dk7coitah/image/upload/v1234567890/category-images/xyz789.jpg",
    "fileName": "vegetables.jpg",
    "fileSize": "245680"
  }
}

# Step 2: Create category with image URL
curl -X POST http://localhost:8080/api/categories \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fresh Vegetables",
    "description": "Organic vegetables from local farms",
    "imageUrl": "https://res.cloudinary.com/dk7coitah/image/upload/v1234567890/category-images/xyz789.jpg",
    "active": true
  }'
```

---

## Cloudinary URL Transformations

Use the same image URL with different transformations for different use cases:

### Original Full Image
```
https://res.cloudinary.com/dk7coitah/image/upload/category-images/xyz789.jpg
```

### Thumbnail (400x300, fill)
```
https://res.cloudinary.com/dk7coitah/image/upload/w_400,h_300,c_fill/category-images/xyz789.jpg
```

### Small Icon (64x64, smart crop)
```
https://res.cloudinary.com/dk7coitah/image/upload/w_64,h_64,c_thumb,g_auto/category-images/xyz789.jpg
```

### Mobile Optimized (800x600, quality 80%)
```
https://res.cloudinary.com/dk7coitah/image/upload/w_800,h_600,c_fill,q_80/category-images/xyz789.jpg
```

### Responsive Image Component (React Example)

```typescript
interface CategoryImageProps {
  imageUrl: string;
  alt: string;
  size?: 'icon' | 'thumbnail' | 'medium' | 'large';
}

const CategoryImage: React.FC<CategoryImageProps> = ({ imageUrl, alt, size = 'thumbnail' }) => {
  const transformations = {
    icon: 'w_64,h_64,c_thumb,g_auto',
    thumbnail: 'w_400,h_300,c_fill',
    medium: 'w_800,h_600,c_fill,q_80',
    large: 'w_1200,h_800,c_fill',
  };

  // Insert transformation into Cloudinary URL
  const getTransformedUrl = (url: string, transform: string) => {
    return url.replace('/upload/', `/upload/${transform}/`);
  };

  const transformedUrl = getTransformedUrl(imageUrl, transformations[size]);

  return (
    <img
      src={transformedUrl}
      alt={alt}
      loading="lazy"
      style={{ width: '100%', height: 'auto' }}
    />
  );
};

export default CategoryImage;
```

---

## Testing Checklist

- [ ] Upload PNG image (should work)
- [ ] Upload JPG image (should work)
- [ ] Upload file > 10MB (should fail with error)
- [ ] Upload non-image file (should fail with error)
- [ ] Create category without image (should work, imageUrl is optional)
- [ ] Create category with image (should work)
- [ ] Update category image (should work)
- [ ] View category image with different transformations (thumbnail, icon, etc.)
- [ ] Verify image appears in Cloudinary dashboard under "category-images" folder

---

## Configuration Summary

### Backend Files Modified:
1. ✅ `StorageBucket.java` - Added CATEGORY_IMAGES enum
2. ✅ `FileStorageController.java` - Added upload endpoint
3. ✅ `CLAUDE.md` - Updated documentation

### No Changes Needed:
- ❌ `application.properties` - Cloudinary config is already set up
- ❌ `CloudinaryConfig.java` - Works dynamically with folder names
- ❌ `FileStorageService.java` - Already supports all StorageBucket enums

### Frontend Files to Create:
1. `/fe_admin/app/service/categoryService.ts` - API service layer
2. `/fe_admin/app/pages/categories/CategoryForm.tsx` - Form component
3. `/fe_admin/app/components/CategoryImage.tsx` - Reusable image component

---

## Security Notes

- Category image upload requires authentication (admin JWT token)
- Max file size enforced in FileStorageService
- Only image file types accepted
- Files stored in dedicated "category-images" Cloudinary folder
- Delete endpoint requires bucket name to prevent unauthorized deletion

---

## Best Practices

1. **Always upload image before creating category** (frontend should handle this in sequence)
2. **Store only the base URL** in database (don't include transformations)
3. **Apply transformations in frontend** using URL manipulation
4. **Use lazy loading** for category images in lists
5. **Provide fallback image** if imageUrl is null/empty
6. **Validate image dimensions** on frontend before upload (optional)
7. **Show upload progress** for better UX (optional)

---

## Troubleshooting

### Issue: "Invalid bucket name"
**Solution**: Use exact enum name: `CATEGORY_IMAGES` or folder name: `category-images`

### Issue: Image upload fails with 401
**Solution**: Ensure JWT token is included in Authorization header

### Issue: Image doesn't appear in Cloudinary
**Solution**: Check Cloudinary credentials in application.properties

### Issue: Large images cause slow page load
**Solution**: Always use Cloudinary transformations to resize images appropriately

---

## Next Steps

1. Build admin frontend UI for category management
2. Add image validation (dimensions, aspect ratio)
3. Add image cropping tool in frontend (optional)
4. Add bulk category import with images (optional)
5. Add SEO alt text field for category images (optional)
