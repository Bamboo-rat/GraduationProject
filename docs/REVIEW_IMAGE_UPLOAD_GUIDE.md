# Review Image Upload Guide

## Tổng quan
Hướng dẫn upload ảnh minh họa cho đánh giá sản phẩm sử dụng Cloudinary cloud storage.

## Quy trình Upload

### Bước 1: Upload ảnh lên cloud
**Endpoint**: `POST /api/reviews/upload-image`

```http
POST /api/reviews/upload-image
Authorization: Bearer {customer_token}
Content-Type: multipart/form-data

file: [image file]
```

**Response Success**:
```json
{
  "imageUrl": "https://res.cloudinary.com/.../review-images/uuid_timestamp.jpg",
  "message": "Upload thành công"
}
```

**Response Error**:
```json
{
  "error": "Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)"
}
```

### Bước 2: Tạo review với imageUrl
**Endpoint**: `POST /api/reviews`

```http
POST /api/reviews
Authorization: Bearer {customer_token}
Content-Type: application/json

{
  "orderDetailId": "order-detail-uuid",
  "rating": 5,
  "comment": "Sản phẩm rất tốt",
  "imageUrl": "https://res.cloudinary.com/.../review-images/uuid_timestamp.jpg"
}
```

**Kết quả**:
- ✅ Review được tạo với ảnh
- ✅ Customer nhận **15 điểm** (10 base + 5 image bonus)
- ✅ PointTransaction: "Đánh giá sản phẩm X (có ảnh minh họa)"

## API Specification

### POST /api/reviews/upload-image

**Authentication**: Required (CUSTOMER role)

**Request**:
- Content-Type: `multipart/form-data`
- Parameter: `file` (MultipartFile)

**Validation Rules**:
| Rule | Condition | Error Message |
|------|-----------|---------------|
| Not empty | File size > 0 | File không được để trống |
| Image type | Content-Type starts with `image/` | Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP) |
| Max size | File size ≤ 5MB | Kích thước file không được vượt quá 5MB |

**Supported Formats**:
- ✅ JPEG/JPG
- ✅ PNG
- ✅ GIF
- ✅ WebP
- ✅ BMP
- ✅ SVG
- ✅ TIFF

**Response Status Codes**:
| Status | Description |
|--------|-------------|
| 200 OK | Upload thành công |
| 400 Bad Request | Validation error (empty file, wrong type, too large) |
| 401 Unauthorized | Token không hợp lệ hoặc hết hạn |
| 403 Forbidden | Không có quyền CUSTOMER |
| 500 Internal Server Error | Lỗi server hoặc Cloudinary |

## Frontend Integration

### JavaScript/Fetch Example

```javascript
async function uploadReviewImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/reviews/upload-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    const data = await response.json();
    return data.imageUrl; // Use this URL in createReview
    
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

async function createReviewWithImage(orderDetailId, rating, comment, imageFile) {
  // Step 1: Upload image
  const imageUrl = await uploadReviewImage(imageFile);
  
  // Step 2: Create review with imageUrl
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${customerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderDetailId,
      rating,
      comment,
      imageUrl // ← Image URL from step 1
    })
  });
  
  return await response.json();
}
```

### React Example

```jsx
import { useState } from 'react';

function ReviewForm({ orderDetailId }) {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }
    
    setImage(file);
    
    // Auto upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/reviews/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setImageUrl(data.imageUrl);
      alert('Upload thành công!');
      
    } catch (error) {
      alert('Upload thất bại: ' + error.message);
      setImage(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderDetailId,
        rating,
        comment,
        imageUrl // Optional, can be null
      })
    });
    
    const result = await response.json();
    
    // Check points earned
    if (imageUrl) {
      alert('Đánh giá thành công! Bạn nhận được 15 điểm (có ảnh)');
    } else {
      alert('Đánh giá thành công! Bạn nhận được 10 điểm');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Đánh giá: {rating} sao</label>
        <input 
          type="range" 
          min="1" 
          max="5" 
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />
      </div>
      
      <textarea 
        placeholder="Nhận xét của bạn..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      
      <div>
        <label>Thêm ảnh (tùy chọn, +5 điểm):</label>
        <input 
          type="file" 
          accept="image/*"
          onChange={handleImageChange}
          disabled={uploading}
        />
        {uploading && <span>Đang upload...</span>}
        {imageUrl && (
          <div>
            <img src={imageUrl} alt="Preview" style={{maxWidth: '200px'}} />
            <span>✓ Đã upload</span>
          </div>
        )}
      </div>
      
      <button type="submit">
        Gửi đánh giá {imageUrl ? '(+15 điểm)' : '(+10 điểm)'}
      </button>
    </form>
  );
}
```

## Cloudinary Storage Structure

```
review-images/
  ├── uuid_timestamp1.jpg
  ├── uuid_timestamp2.png
  ├── uuid_timestamp3.webp
  └── ...
```

**Naming Pattern**: `{UUID}_{timestamp}.{extension}`

Example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890_1699012345678.jpg`

## Security & Best Practices

### 1. File Validation
✅ **Server-side validation** (enforced):
- File type check (Content-Type must be `image/*`)
- File size limit (5MB max)
- Empty file check

✅ **Client-side validation** (recommended):
- Pre-upload file type check
- Pre-upload size check
- Image preview before upload

### 2. Error Handling

```javascript
try {
  const imageUrl = await uploadReviewImage(file);
} catch (error) {
  if (error.message.includes('5MB')) {
    // Show "File too large" message
  } else if (error.message.includes('ảnh')) {
    // Show "Wrong file type" message
  } else {
    // Show generic error
  }
}
```

### 3. Progressive Upload
- Upload image FIRST
- Then create review with imageUrl
- Benefits:
  - Better error handling
  - No orphaned images
  - Clearer UX (upload progress)

### 4. Image Optimization (Frontend)
```javascript
// Before upload, compress large images
async function compressImage(file) {
  // Use libraries like browser-image-compression
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  });
  return compressed;
}
```

## Bonus Points Logic

| Scenario | Base Points | Image Bonus | Total Points |
|----------|-------------|-------------|--------------|
| Review without image | 10 | 0 | **10** |
| Review with image | 10 | 5 | **15** |
| Update review (add image later) | 0 | 0 | **0** (no additional points) |

**Important**: Bonus points only awarded on review **creation**, not on update.

## Testing Checklist

- [ ] Upload valid image (JPG) → Success
- [ ] Upload valid image (PNG) → Success  
- [ ] Upload PDF → Error 400 "Chỉ chấp nhận file ảnh"
- [ ] Upload 6MB image → Error 400 "Không được vượt quá 5MB"
- [ ] Upload empty file → Error 400 "Không được để trống"
- [ ] Create review with uploaded imageUrl → Get 15 points
- [ ] Create review without image → Get 10 points
- [ ] Update review to add image → No additional points
- [ ] Image displays correctly in review list
- [ ] Image URL is accessible publicly

## Troubleshooting

### Error: "Upload thất bại"
**Possible causes**:
1. Cloudinary credentials not configured
2. Network timeout
3. Invalid Cloudinary config

**Solution**: Check application.properties for Cloudinary settings

### Error: 401 Unauthorized
**Cause**: Token expired or invalid

**Solution**: Re-login to get new token

### Image not displaying
**Possible causes**:
1. Wrong URL format
2. Image deleted from Cloudinary
3. Cloudinary account suspended

**Solution**: Check imageUrl in database, verify Cloudinary dashboard

## Postman Testing

### 1. Upload Image
```
POST http://localhost:8080/api/reviews/upload-image
Headers:
  Authorization: Bearer {token}
Body:
  form-data
  - key: file
  - type: File
  - value: [select image file]
```

### 2. Create Review
```
POST http://localhost:8080/api/reviews
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
Body:
{
  "orderDetailId": "xxx",
  "rating": 5,
  "comment": "Great product!",
  "imageUrl": "{url from step 1}"
}
```

## Future Enhancements

1. **Multiple Images**: Support array of imageUrls
2. **Image Compression**: Auto-compress on server
3. **Thumbnails**: Generate thumbnails for list views
4. **Watermark**: Add store watermark to prevent fraud
5. **Image Moderation**: Auto-detect inappropriate content using AI
