# PayOS Payment Integration - Mobile Guide

## Tổng quan

Hệ thống tích hợp PayOS cho thanh toán trực tuyến trên mobile app. PayOS hỗ trợ thanh toán qua:
- QR Code (quét bằng app ngân hàng)
- WebView (mở trang thanh toán trong app)
- Deep linking (redirect về app sau khi thanh toán)

## Kiến trúc

```
Mobile App → Backend API → PayOS API
     ↑                           ↓
     └─────── Webhook ←──────────┘
```

## Endpoints

### 1. Tạo Payment Link

**Endpoint:** `POST /api/payments/payos/create-payment-link`  
**Auth:** Required (CUSTOMER role)

**Request:**
```json
{
  "orderId": "uuid-order-id",
  "amount": 500000,
  "description": "Thanh toán đơn hàng #FS123456",
  "returnUrl": "foodsave://payment/success",
  "cancelUrl": "foodsave://payment/cancel"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Tạo link thanh toán thành công",
  "data": {
    "paymentLinkId": "1234567890",
    "orderCode": "FS123456",
    "amount": 500000,
    "checkoutUrl": "https://pay.payos.vn/web/xxx",
    "qrCode": "https://qr.payos.vn/xxx.png",
    "status": "PENDING",
    "createdAt": "2025-11-14T10:00:00",
    "expiresAt": "2025-11-14T10:15:00"
  }
}
```

### 2. Kiểm tra trạng thái thanh toán

**Endpoint:** `GET /api/payments/payos/payment-status/{orderId}`  
**Auth:** Required (CUSTOMER role)

**Response:**
```json
{
  "code": 200,
  "message": "Lấy trạng thái thanh toán thành công",
  "data": {
    "paymentLinkId": "1234567890",
    "orderCode": "FS123456",
    "amount": 500000,
    "status": "PAID",
    "createdAt": "2025-11-14T10:00:00"
  }
}
```

**Payment Status:**
- `PENDING` - Đang chờ thanh toán
- `PAID` - Đã thanh toán thành công
- `CANCELLED` - Đã hủy

### 3. Hủy thanh toán

**Endpoint:** `POST /api/payments/payos/cancel-payment/{orderId}`  
**Auth:** Required (CUSTOMER role)

**Response:**
```json
{
  "code": 200,
  "message": "Hủy thanh toán thành công",
  "data": null
}
```

## Flow thanh toán trên Mobile

### Option 1: QR Code Payment (Recommended)

```
1. Customer chọn thanh toán online
2. App gọi POST /api/payments/payos/create-payment-link
3. Backend trả về qrCode URL
4. App hiển thị QR code cho customer
5. Customer quét QR bằng app ngân hàng
6. Customer xác nhận thanh toán trên app ngân hàng
7. PayOS gửi webhook về backend
8. App polling GET /api/payments/payos/payment-status/{orderId}
9. Khi status = "PAID", hiển thị thành công
```

**Code example (React Native):**
```jsx
import { Image } from 'react-native';

// Create payment
const createPayment = async (orderId, amount) => {
  const response = await fetch('/api/payments/payos/create-payment-link', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderId,
      amount,
      returnUrl: 'foodsave://payment/success',
      cancelUrl: 'foodsave://payment/cancel'
    })
  });
  
  const result = await response.json();
  return result.data;
};

// Display QR code
const PaymentScreen = ({ orderId, amount }) => {
  const [paymentData, setPaymentData] = useState(null);
  
  useEffect(() => {
    createPayment(orderId, amount).then(setPaymentData);
  }, []);
  
  // Poll payment status every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/payments/payos/payment-status/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.data.status === 'PAID') {
        clearInterval(interval);
        navigation.navigate('PaymentSuccess');
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [orderId]);
  
  return (
    <View>
      <Text>Quét mã QR để thanh toán</Text>
      {paymentData && (
        <Image 
          source={{ uri: paymentData.qrCode }}
          style={{ width: 300, height: 300 }}
        />
      )}
      <Text>Số tiền: {amount.toLocaleString()} VNĐ</Text>
      <Text>Hết hạn sau: 15 phút</Text>
    </View>
  );
};
```

### Option 2: WebView Payment

```
1. Customer chọn thanh toán online
2. App gọi POST /api/payments/payos/create-payment-link
3. Backend trả về checkoutUrl
4. App mở WebView với checkoutUrl
5. Customer điền thông tin thanh toán trên WebView
6. PayOS redirect về returnUrl (deep link)
7. App bắt deep link và hiển thị kết quả
```

**Code example (React Native):**
```jsx
import { WebView } from 'react-native-webview';
import { Linking } from 'react-native';

const PaymentWebView = ({ orderId, amount }) => {
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  
  useEffect(() => {
    createPayment(orderId, amount).then(data => {
      setCheckoutUrl(data.checkoutUrl);
    });
    
    // Listen for deep link
    const handleUrl = ({ url }) => {
      if (url.includes('foodsave://payment/success')) {
        navigation.navigate('PaymentSuccess');
      } else if (url.includes('foodsave://payment/cancel')) {
        navigation.navigate('PaymentCancel');
      }
    };
    
    Linking.addEventListener('url', handleUrl);
    return () => Linking.removeEventListener('url', handleUrl);
  }, []);
  
  return checkoutUrl ? (
    <WebView 
      source={{ uri: checkoutUrl }}
      onNavigationStateChange={(navState) => {
        // Handle navigation
        if (navState.url.includes('foodsave://')) {
          Linking.openURL(navState.url);
        }
      }}
    />
  ) : <ActivityIndicator />;
};
```

## Deep Link Configuration

### iOS (Info.plist)
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>foodsave</string>
    </array>
  </dict>
</array>
```

### Android (AndroidManifest.xml)
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="foodsave" android:host="payment" />
</intent-filter>
```

## Error Handling

```javascript
try {
  const response = await createPayment(orderId, amount);
  // Success
} catch (error) {
  if (error.code === 'ORDER_NOT_FOUND') {
    showAlert('Không tìm thấy đơn hàng');
  } else if (error.code === 'INVALID_ORDER_STATUS') {
    showAlert('Đơn hàng không thể thanh toán');
  } else if (error.code === 'EXTERNAL_SERVICE_ERROR') {
    showAlert('Lỗi kết nối PayOS. Vui lòng thử lại sau');
  } else {
    showAlert('Có lỗi xảy ra. Vui lòng thử lại');
  }
}
```

## Security Notes

1. **HTTPS only** - Tất cả API calls phải qua HTTPS
2. **Token authentication** - Luôn gửi Bearer token trong header
3. **Webhook verification** - Backend tự động verify signature từ PayOS
4. **Timeout handling** - Payment link hết hạn sau 15 phút
5. **Polling rate** - Không poll quá 1 lần/giây để tránh spam

## Testing

### Test Card (PayOS Sandbox)
```
Card Number: 9704198526191432198
Card Holder: NGUYEN VAN A
Expiry Date: 07/15
OTP: 123456
```

### Test Endpoint
```bash
GET /api/payments/payos/test-config
Authorization: Bearer {admin-token}
```

## Webhook (Backend Only)

**Endpoint:** `POST /api/payments/payos/webhook`  
**Auth:** None (public endpoint, verified by signature)

PayOS sẽ gửi webhook khi:
- Payment thành công
- Payment thất bại
- Payment timeout

Backend tự động xử lý và update order status.

## Support

- PayOS Documentation: https://payos.vn/docs
- Backend Team: [your-backend-email]
- Issues: [your-github-issues]
