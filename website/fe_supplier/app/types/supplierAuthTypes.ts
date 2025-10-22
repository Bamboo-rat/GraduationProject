// Business Types
export type BusinessType =
  | 'RESTAURANT'
  | 'GROCERY_STORE'
  | 'COFFEE_SHOP'
  | 'BAKERY'
  | 'SUPERMARKET'
  | 'CONVENIENCE_STORE'
  | 'DISTRIBUTOR'
  | 'OTHER';

// Step 1: Basic Account Registration
export interface SupplierRegisterStep1Request {
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  password: string;
}

// Step 2: Email OTP Verification
export interface SupplierRegisterStep2Request {
  supplierId: string;
  email: string;
  otp: string;
}

// Step 3: Document Upload
export interface SupplierRegisterStep3Request {
  supplierId: string;
  email: string;
  businessLicense: string;
  businessLicenseUrl: string;
  foodSafetyCertificate: string;
  foodSafetyCertificateUrl: string;
  avatarUrl?: string;
}

// Step 4: Business and Store Information
export interface SupplierRegisterStep4Request {
  supplierId: string;
  email: string;
  businessName: string;
  businessAddress: string;
  taxCode: string;
  businessType: BusinessType;
  storeName: string;
  storeAddress: string;
  storePhoneNumber: string;
  latitude: string;
  longitude: string;
  storeDescription?: string;
}

// Login Request
export interface SupplierLoginRequest {
  username: string;
  password: string;
}
