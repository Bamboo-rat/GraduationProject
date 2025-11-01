# Product Variant Stock Logic - Chi tiết hóa trạng thái sản phẩm

## 📊 Tổng quan

Hệ thống đã được cải tiến để cung cấp **thông tin chi tiết** về tồn kho và trạng thái của từng **biến thể sản phẩm**, giúp frontend hiển thị chính xác hơn cho người dùng.

---

## 🏗️ Cấu trúc dữ liệu

### **1. Product (Sản phẩm)**
```json
{
  "productId": "uuid",
  "name": "Nước Giặt Comfort",
  "status": "ACTIVE",  // ACTIVE, SOLD_OUT, EXPIRED, SUSPENDED, INACTIVE
  
  // ✨ THÔNG TIN MỚI - Tổng quan
  "totalInventory": 150,          // Tổng tồn kho TẤT CẢ variants ở TẤT CẢ stores
  "availableVariantCount": 2,     // Số variants còn hàng VÀ chưa hết hạn
  "totalVariantCount": 3,         // Tổng số variants
  
  "variants": [...]
}
```

### **2. ProductVariant (Biến thể)**
```json
{
  "variantId": "uuid",
  "name": "Chai 1.8L Hương Hoa Anh Đào",
  "sku": "SUP0403-OGDV-NGCDV-HAĐ-1234",
  "originalPrice": 95000,
  "discountPrice": 80000,
  "expiryDate": "2025-12-31",
  
  // ✨ THÔNG TIN MỚI - Trạng thái chi tiết
  "totalStock": 80,              // Tổng tồn kho của VARIANT NÀY ở TẤT CẢ stores
  "isOutOfStock": false,         // true nếu totalStock = 0
  "isExpired": false,            // true nếu đã quá hạn sử dụng
  "isAvailable": true,           // true nếu còn hàng VÀ chưa hết hạn
  
  // ✨ Chi tiết theo từng cửa hàng
  "storeStocks": [
    {
      "storeId": "store-1",
      "storeName": "SaveFood Quận 1",
      "stockQuantity": 50,
      "priceOverride": null      // Giá đặc biệt tại cửa hàng này (nếu có)
    },
    {
      "storeId": "store-2", 
      "storeName": "SaveFood Quận 2",
      "stockQuantity": 30,
      "priceOverride": 75000    // Giảm giá đặc biệt tại Q2
    },
    {
      "storeId": "store-3",
      "storeName": "SaveFood Quận 3", 
      "stockQuantity": 0,       // Hết hàng ở cửa hàng này
      "priceOverride": null
    }
  ]
}
```

---

## 🔄 Logic cập nhật trạng thái sản phẩm

### **Thứ tự ưu tiên:**

1. **EXPIRED** (Hết hạn)
   - Khi: **TẤT CẢ** variants đều đã hết hạn
   - Logic: `product.allVariantsExpired() == true`

2. **SOLD_OUT** (Hết hàng)
   - Khi: **TẤT CẢ** variants đều hết hàng (tổng inventory = 0)
   - Logic: `product.getTotalInventory() == 0`

3. **ACTIVE** (Còn hàng)
   - Khi: **ÍT NHẤT 1** variant còn hàng VÀ chưa hết hạn
   - Logic: `product.hasAvailableVariant() == true`

### **Ví dụ thực tế:**

#### Trường hợp 1: Sản phẩm ACTIVE
```
Product: Nước Giặt Comfort
├─ Variant 1: Chai 1.8L
│  ├─ Store Q1: 50 chai ✅
│  ├─ Store Q2: 30 chai ✅
│  └─ Store Q3: 0 chai ❌
│  → totalStock = 80 ✅ Available
│
├─ Variant 2: Chai 3.6L  
│  ├─ Store Q1: 20 chai ✅
│  └─ Store Q2: 0 chai ❌
│  → totalStock = 20 ✅ Available
│
└─ Variant 3: Túi 2.4L
   ├─ Store Q1: 0 chai ❌
   └─ Store Q2: 0 chai ❌
   → totalStock = 0 ❌ Out of stock

Product Status: ACTIVE ✅ (có 2 variants available)
```

#### Trường hợp 2: Sản phẩm SOLD_OUT
```
Product: Nước Giặt Comfort
├─ Variant 1: 0 chai (hết hàng)
├─ Variant 2: 0 chai (hết hàng)
└─ Variant 3: 0 chai (hết hàng)

Product Status: SOLD_OUT ❌ (không có variant nào còn hàng)
```

#### Trường hợp 3: Sản phẩm EXPIRED
```
Product: Nước Giặt Comfort
├─ Variant 1: Hạn 2024-01-01 (đã hết hạn)
├─ Variant 2: Hạn 2024-02-01 (đã hết hạn)
└─ Variant 3: Hạn 2024-03-01 (đã hết hạn)

Product Status: EXPIRED ⚠️ (tất cả variants đã hết hạn)
```

---

## 🎨 Gợi ý hiển thị Frontend

### **1. Danh sách sản phẩm (Product List)**
```jsx
function ProductCard({ product }) {
  return (
    <div className="product-card">
      <img src={product.images[0]?.imageUrl} alt={product.name} />
      <h3>{product.name}</h3>
      
      {/* Badge trạng thái */}
      {product.status === 'SOLD_OUT' && <Badge color="red">Hết hàng</Badge>}
      {product.status === 'EXPIRED' && <Badge color="orange">Hết hạn</Badge>}
      
      {/* Thông tin tồn kho */}
      <div className="stock-info">
        <span>{product.availableVariantCount} / {product.totalVariantCount} biến thể còn hàng</span>
        <span>Tổng: {product.totalInventory} sản phẩm</span>
      </div>
    </div>
  );
}
```

### **2. Chi tiết sản phẩm - Chọn biến thể**
```jsx
function VariantSelector({ variants }) {
  return (
    <div className="variant-selector">
      {variants.map(variant => (
        <button 
          key={variant.variantId}
          disabled={!variant.isAvailable}
          className={variant.isAvailable ? 'available' : 'unavailable'}
        >
          <span>{variant.name}</span>
          
          {/* Hiển thị trạng thái */}
          {variant.isExpired && <Badge color="orange">Hết hạn</Badge>}
          {variant.isOutOfStock && <Badge color="red">Hết hàng</Badge>}
          {variant.isAvailable && (
            <span className="stock-badge">{variant.totalStock} còn lại</span>
          )}
          
          {/* Giá */}
          <div className="price">
            {variant.discountPrice ? (
              <>
                <span className="original">{variant.originalPrice}đ</span>
                <span className="discount">{variant.discountPrice}đ</span>
              </>
            ) : (
              <span>{variant.originalPrice}đ</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
```

### **3. Chi tiết tồn kho theo cửa hàng**
```jsx
function StoreStockDetail({ variant, selectedStoreId }) {
  const storeStock = variant.storeStocks.find(s => s.storeId === selectedStoreId);
  
  if (!storeStock) return <p>Không có tại cửa hàng này</p>;
  
  return (
    <div className="store-stock">
      <h4>{storeStock.storeName}</h4>
      
      {storeStock.stockQuantity > 0 ? (
        <>
          <p>Còn {storeStock.stockQuantity} sản phẩm</p>
          <p className="price">
            {storeStock.priceOverride 
              ? `${storeStock.priceOverride}đ (giá đặc biệt)`
              : `${variant.discountPrice || variant.originalPrice}đ`
            }
          </p>
        </>
      ) : (
        <Badge color="red">Hết hàng tại cửa hàng này</Badge>
      )}
    </div>
  );
}
```

### **4. Danh sách cửa hàng có sẵn**
```jsx
function AvailableStores({ variant }) {
  const availableStores = variant.storeStocks.filter(s => s.stockQuantity > 0);
  
  return (
    <div className="available-stores">
      <h4>Có sẵn tại {availableStores.length} cửa hàng:</h4>
      <ul>
        {availableStores.map(store => (
          <li key={store.storeId}>
            <span>{store.storeName}</span>
            <span className="stock">{store.stockQuantity} sản phẩm</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 📱 Use Cases

### **Use Case 1: Khách hàng tìm sản phẩm**
```
1. Khách vào danh sách sản phẩm
2. Hệ thống hiển thị:
   - Sản phẩm ACTIVE: Hiện đầy đủ, có badge "Còn hàng"
   - Sản phẩm SOLD_OUT: Hiện mờ, badge "Hết hàng"
   - Sản phẩm EXPIRED: Ẩn hoặc hiện badge "Hết hạn"
```

### **Use Case 2: Khách chọn biến thể**
```
1. Khách click vào sản phẩm
2. Hệ thống hiển thị danh sách variants:
   - Variant available (isAvailable=true): Enable, hiện tồn kho
   - Variant hết hàng (isOutOfStock=true): Disable, badge "Hết hàng"
   - Variant hết hạn (isExpired=true): Disable, badge "Hết hạn"
```

### **Use Case 3: Khách chọn cửa hàng**
```
1. Khách chọn variant
2. Hệ thống hiển thị danh sách storeStocks:
   - Store có hàng (stockQuantity > 0): Hiện số lượng + giá
   - Store hết hàng (stockQuantity = 0): Badge "Hết hàng tại cửa hàng này"
   - Nếu có priceOverride: Hiển thị giá đặc biệt
```

### **Use Case 4: Supplier quản lý sản phẩm**
```
1. Supplier vào trang quản lý sản phẩm
2. Xem tổng quan:
   - Product status: ACTIVE/SOLD_OUT/EXPIRED
   - availableVariantCount: "2/3 variants còn hàng"
   - totalInventory: "150 sản phẩm"
3. Click chi tiết variant:
   - Xem tồn kho từng cửa hàng
   - Thấy variant nào hết hàng/hết hạn
```

---

## 🚀 API Changes

### **GET /api/products/{id}**
**Response mới:**
```json
{
  "success": true,
  "data": {
    "productId": "uuid",
    "name": "Nước Giặt Comfort",
    "status": "ACTIVE",
    "totalInventory": 150,
    "availableVariantCount": 2,
    "totalVariantCount": 3,
    "variants": [
      {
        "variantId": "uuid",
        "name": "Chai 1.8L",
        "totalStock": 80,
        "isOutOfStock": false,
        "isExpired": false,
        "isAvailable": true,
        "storeStocks": [
          {
            "storeId": "store-1",
            "storeName": "SaveFood Quận 1",
            "stockQuantity": 50,
            "priceOverride": null
          },
          {
            "storeId": "store-2",
            "storeName": "SaveFood Quận 2",
            "stockQuantity": 30,
            "priceOverride": 75000
          }
        ]
      }
    ]
  }
}
```

---

## ✅ Tóm tắt

### **Các cải tiến:**
1. ✅ **Product-level**: Thêm `totalInventory`, `availableVariantCount`, `totalVariantCount`
2. ✅ **Variant-level**: Thêm `totalStock`, `isOutOfStock`, `isExpired`, `isAvailable`
3. ✅ **Store-level**: Thêm `storeStocks` array với chi tiết từng cửa hàng
4. ✅ **Logic status**: Cải tiến để chính xác hơn (ACTIVE khi có ÍT NHẤT 1 variant available)

### **Lợi ích:**
- 🎯 **Frontend dễ hiển thị**: Có đầy đủ thông tin cần thiết
- 🚀 **UX tốt hơn**: Khách biết rõ sản phẩm nào còn/hết hàng
- 📊 **Supplier quản lý tốt**: Thấy chi tiết tồn kho từng variant/store
- 🔍 **Search/Filter chính xác**: Filter theo status, availability

---

## 📝 Migration Note

**Không cần migration database!** Tất cả là computed fields, không lưu vào DB.

Chỉ cần update frontend để sử dụng fields mới trong API response! 🎉
