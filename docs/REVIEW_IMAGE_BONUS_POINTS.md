# Review Image Bonus Points Feature

## Tổng quan
Tính năng thưởng điểm thêm khi khách hàng đánh giá sản phẩm có kèm ảnh minh họa.

## Mục đích
- Khuyến khích khách hàng tải ảnh thật khi đánh giá sản phẩm
- Tăng độ tin cậy và chất lượng của đánh giá
- Cải thiện trải nghiệm mua sắm cho khách hàng khác

## Quy tắc tích điểm

### Điểm thưởng cơ bản (Base Review Bonus)
- **Config key**: `points.review.bonus`
- **Giá trị mặc định**: 10 điểm
- **Điều kiện**: Khách hàng viết đánh giá cho sản phẩm đã mua

### Điểm thưởng thêm cho ảnh (Image Bonus)
- **Config key**: `points.review.image.bonus`
- **Giá trị mặc định**: 5 điểm
- **Điều kiện**: Đánh giá có kèm ảnh minh họa (imageUrl không rỗng)

### Tổng điểm
- **Đánh giá không có ảnh**: 10 điểm
- **Đánh giá có ảnh**: 15 điểm (10 + 5)

## Cấu trúc dữ liệu

### Review Entity
```java
@Entity
@Table(name = "reviews")
public class Review {
    @Id
    private String reviewId;
    
    private int rating;               // 1-5 stars
    private String comment;           // Optional text review
    private String imageUrl;          // NEW: Review image URL
    private boolean markedAsSpam;
    private LocalDateTime createdAt;
    
    // Relationships
    @ManyToOne private Customer customer;
    @ManyToOne private Product product;
    @ManyToOne private Store store;
    @OneToOne private OrderDetail orderDetail;
}
```

### CreateReviewRequest DTO
```java
public class CreateReviewRequest {
    @NotBlank
    private String orderDetailId;
    
    @Min(1) @Max(5)
    private Integer rating;
    
    @Size(max = 1000)
    private String comment;
    
    @Size(max = 1000)
    private String imageUrl;  // NEW: Optional image URL
}
```

### ReviewResponse DTO
```java
public class ReviewResponse {
    private String reviewId;
    private int rating;
    private String comment;
    private String imageUrl;      // NEW: Review image
    private String productImage;  // Product's default image
    private boolean canEdit;
    private boolean canDelete;
    // ... other fields
}
```

## Business Logic

### Tạo đánh giá có ảnh
```java
@Override
public ReviewResponse createReview(String customerId, CreateReviewRequest request) {
    // 1. Validate order ownership, delivery status, no duplicate review
    
    // 2. Create review
    Review review = new Review();
    review.setRating(request.getRating());
    review.setComment(request.getComment());
    review.setImageUrl(request.getImageUrl());  // Save image URL
    
    // 3. Calculate bonus points
    int bonusPoints = systemConfigService.getConfigValueAsInteger(
        "points.review.bonus", 10
    );
    
    // 4. Add image bonus if image provided
    boolean hasImage = request.getImageUrl() != null && !request.getImageUrl().trim().isEmpty();
    if (hasImage) {
        int imageBonusPoints = systemConfigService.getConfigValueAsInteger(
            "points.review.image.bonus", 5
        );
        bonusPoints += imageBonusPoints;
    }
    
    // 5. Award points and create transaction
    customer.setPoints(customer.getPoints() + bonusPoints);
    
    PointTransaction transaction = new PointTransaction();
    transaction.setPointsChange(bonusPoints);
    transaction.setTransactionType(PointTransactionType.BONUS);
    transaction.setReason("Đánh giá sản phẩm " + product.getName() + 
        (hasImage ? " (có ảnh minh họa)" : ""));
    
    return mapToResponse(review, customerId);
}
```

## API Endpoints

### POST /api/reviews
**Tạo đánh giá mới**

Request:
```json
{
  "orderDetailId": "123e4567-e89b-12d3-a456-426614174000",
  "rating": 5,
  "comment": "Sản phẩm rất tốt, đóng gói cẩn thận",
  "imageUrl": "https://storage.example.com/reviews/image123.jpg"
}
```

Response:
```json
{
  "reviewId": "review-uuid",
  "rating": 5,
  "comment": "Sản phẩm rất tốt, đóng gói cẩn thận",
  "imageUrl": "https://storage.example.com/reviews/image123.jpg",
  "productImage": "https://storage.example.com/products/product123.jpg",
  "createdAt": "2025-11-03T10:30:00",
  "canEdit": true,
  "canDelete": true
}
```

**Point Transaction Created**:
```
Type: BONUS
Points: +15
Reason: "Đánh giá sản phẩm Áo thun nam (có ảnh minh họa) - Đơn hàng #ORD123456"
```

### PUT /api/reviews/{reviewId}
**Cập nhật đánh giá**

Request:
```json
{
  "rating": 4,
  "comment": "Cập nhật: Sản phẩm tốt nhưng size hơi nhỏ",
  "imageUrl": "https://storage.example.com/reviews/image456.jpg"
}
```

**Note**: 
- Điểm thưởng chỉ được tính khi TẠO đánh giá lần đầu
- Cập nhật đánh giá (thêm/sửa/xóa ảnh) KHÔNG thay đổi điểm đã nhận

## Database Schema

### reviews table
```sql
CREATE TABLE reviews (
    review_id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    store_id VARCHAR(36) NOT NULL,
    order_detail_id VARCHAR(36) UNIQUE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    image_url VARCHAR(1000),  -- NEW COLUMN
    marked_as_spam BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_has_image ((image_url IS NOT NULL)),
    FOREIGN KEY (customer_id) REFERENCES customers(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (store_id) REFERENCES stores(store_id),
    FOREIGN KEY (order_detail_id) REFERENCES order_details(order_detail_id)
);
```

### system_config additions
```sql
INSERT INTO system_config VALUES
('points.review.bonus', '10', 'Điểm thưởng khi đánh giá sản phẩm', 'NUMBER', TRUE),
('points.review.image.bonus', '5', 'Điểm thưởng thêm khi đánh giá có ảnh', 'NUMBER', TRUE);
```

## Migration Scripts

### V4__Add_review_image_bonus_config.sql
Thêm cấu hình `points.review.image.bonus` vào system_config

### V5__Add_image_url_to_reviews.sql
Thêm cột `image_url` vào bảng reviews

## Validation Rules

1. **imageUrl** - Optional, max 1000 characters
2. **Image bonus** - Chỉ tính khi imageUrl không null và không rỗng (sau trim)
3. **One-time bonus** - Điểm chỉ thưởng lúc tạo, không thưởng khi update
4. **Edit window** - Customer có thể sửa imageUrl trong 7 ngày sau khi tạo

## Admin Configuration

Admin có thể điều chỉnh số điểm thưởng qua System Settings:

1. `points.review.bonus` - Điểm cơ bản cho mọi đánh giá
2. `points.review.image.bonus` - Điểm thêm cho đánh giá có ảnh

Ví dụ chiến dịch khuyến khích:
- Tăng `points.review.image.bonus` từ 5 → 10 điểm
- Khách hàng sẽ nhận 20 điểm (10 + 10) cho đánh giá có ảnh

## Logging

```java
log.info("Awarded {} bonus points for review (base: {}, image: {}): customerId={}, reviewId={}",
    totalPoints, basePoints, imageBonusPoints, customerId, reviewId);
```

Output:
```
Awarded 15 bonus points for review (base: 10, image: 5): customerId=CUST123, reviewId=REV456
```

## Security Considerations

1. **Image URL Validation**:
   - Không validate format URL trong backend (frontend responsibility)
   - Max length 1000 characters để tránh injection
   
2. **Storage Security**:
   - Image upload và storage xử lý ở frontend/CDN layer
   - Backend chỉ lưu URL đã upload thành công
   
3. **Spam Detection**:
   - Admin có thể đánh dấu review có ảnh không phù hợp là spam
   - Spam reviews bị ẩn khỏi public queries

## Testing Checklist

- [ ] Tạo đánh giá không có ảnh → nhận 10 điểm
- [ ] Tạo đánh giá có ảnh → nhận 15 điểm
- [ ] Point transaction có reason đúng (có/không có ảnh)
- [ ] Update đánh giá thêm ảnh → không thưởng điểm thêm
- [ ] Customer có thể xem imageUrl trong response
- [ ] Public API trả về imageUrl của reviews
- [ ] Admin có thể đánh dấu review có ảnh là spam

## Future Enhancements

1. **Multiple Images**: Hỗ trợ nhiều ảnh per review (array of URLs)
2. **Image Quality Bonus**: Điểm thưởng cao hơn cho ảnh HD
3. **Video Support**: Thưởng điểm cho video reviews
4. **Image Moderation**: Auto-detect inappropriate images using AI
5. **Image Analytics**: Track which products get most image reviews
