import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import authService from '../../service/authService';
import type { SupplierRegisterStep1Request,
  SupplierRegisterStep2Request,
  SupplierRegisterStep3Request,
  SupplierRegisterStep4Request,
  BusinessType } from '../../types/supplierAuthTypes';
import fileStorageService from '../../service/fileStorageService';
import AddressAutocomplete from '../../component/features/AddressAutocomplete';
import Toast from '../../component/common/Toast';
import type { ToastType } from '../../component/common/Toast';
import logo from '../assets/image/logo.png';

type RegistrationStep = 1 | 2 | 3 | 4;

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{type: ToastType; message: string} | null>(null);

  // Step 1 data
  const [step1Data, setStep1Data] = useState<SupplierRegisterStep1Request>({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  // Supplier ID from Step 1 response 
  const [supplierId, setSupplierId] = useState<string>('');

  // Step 2 data
  const [otp, setOtp] = useState('');

  // Step 3 data
  const [step3Data, setStep3Data] = useState({
    businessLicense: '',
    businessLicenseFile: null as File | null,
    businessLicenseUrl: '',
    foodSafetyCertificate: '',
    foodSafetyCertificateFile: null as File | null,
    foodSafetyCertificateUrl: '',
    avatarFile: null as File | null,
    avatarUrl: '',
  });
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [licenseFileName, setLicenseFileName] = useState<string>('');
  const [certFileName, setCertFileName] = useState<string>('');
  const [avatarFileName, setAvatarFileName] = useState<string>('');

  // Step 4 data
  const [step4Data, setStep4Data] = useState<Omit<SupplierRegisterStep4Request, 'supplierId'>>({
    email: '',
    businessName: '',
    businessAddress: '',
    taxCode: '',
    businessType: 'RESTAURANT' as BusinessType,
    storeName: '',
    storeAddress: '',
    storePhoneNumber: '',
    latitude: '',
    longitude: '',
    storeDescription: '',
  });

  // ===== STEP 1: Basic Account Registration =====
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step1Data.password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.registerSupplierStep1(step1Data);
      
      if (response.userId) {
        setSupplierId(response.userId);
        console.log('Supplier ID saved:', response.userId);
      }
      
      setToast({
        type: 'success',
        message: `Đăng ký thành công! Mã OTP đã được gửi đến email ${step1Data.email}`
      });
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // ===== STEP 2: Email OTP Verification =====
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp || otp.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 số!');
      return;
    }

    if (!supplierId) {
      setError('Không tìm thấy Supplier ID. Vui lòng thực hiện lại bước 1.');
      return;
    }

    setLoading(true);
    try {
      const request: SupplierRegisterStep2Request = {
        supplierId: supplierId, 
        email: step1Data.email,
        otp: otp,
      };
      console.log('📤 Sending Step 2 request:', request);
      await authService.registerSupplierStep2(request);
      setToast({
        type: 'success',
        message: 'Xác thực email thành công! Vui lòng tải lên các giấy tờ cần thiết.'
      });
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Xác thực OTP thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    
    if (!supplierId) {
      setError('Không tìm thấy Supplier ID. Vui lòng thực hiện lại bước 1.');
      setLoading(false);
      return;
    }
    
    try {
      await authService.resendSupplierOtp(supplierId); 
      setToast({
        type: 'success',
        message: 'Mã OTP mới đã được gửi đến email của bạn!'
      });
    } catch (err: any) {
      setError(err.message || 'Gửi lại OTP thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // ===== STEP 3: Document Upload =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'license' | 'cert' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = fileStorageService.validateFile(file, 5, ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']);
    if (!validation.valid) {
      setError(validation.error || 'File không hợp lệ');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (fileType === 'license') {
        setStep3Data(prev => ({ ...prev, businessLicenseFile: file }));
        setLicensePreview(preview);
        setLicenseFileName(file.name);
      } else if (fileType === 'cert') {
        setStep3Data(prev => ({ ...prev, foodSafetyCertificateFile: file }));
        setCertPreview(preview);
        setCertFileName(file.name);
      } else {
        setStep3Data(prev => ({ ...prev, avatarFile: file }));
        setAvatarPreview(preview);
        setAvatarFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (fileType: 'license' | 'cert' | 'avatar') => {
    if (fileType === 'license') {
      setStep3Data(prev => ({ ...prev, businessLicenseFile: null }));
      setLicensePreview(null);
      setLicenseFileName('');
    } else if (fileType === 'cert') {
      setStep3Data(prev => ({ ...prev, foodSafetyCertificateFile: null }));
      setCertPreview(null);
      setCertFileName('');
    } else {
      setStep3Data(prev => ({ ...prev, avatarFile: null }));
      setAvatarPreview(null);
      setAvatarFileName('');
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!step3Data.businessLicenseFile || !step3Data.foodSafetyCertificateFile) {
      setError('Vui lòng tải lên đầy đủ giấy tờ bắt buộc (GPKD và Chứng nhận ATTP)');
      return;
    }

    if (!supplierId) {
      setError('Không tìm thấy Supplier ID. Vui lòng thực hiện lại bước 1.');
      return;
    }

    setLoading(true);
    try {
      // Upload business license
      const licenseUrl = await fileStorageService.uploadBusinessLicense(step3Data.businessLicenseFile);

      // Upload food safety certificate
      const certUrl = await fileStorageService.uploadFoodSafetyCertificate(step3Data.foodSafetyCertificateFile);

      // Upload avatar if provided
      let avatarUrl = '';
      if (step3Data.avatarFile) {
        avatarUrl = await fileStorageService.uploadSupplierLogo(step3Data.avatarFile);
      }

      // Submit step 3 with URLs
      const request: SupplierRegisterStep3Request = {
        supplierId: supplierId,  // ✅ THÊM supplierId
        email: step1Data.email,
        businessLicense: step3Data.businessLicense,
        businessLicenseUrl: licenseUrl,
        foodSafetyCertificate: step3Data.foodSafetyCertificate,
        foodSafetyCertificateUrl: certUrl,
        avatarUrl: avatarUrl || undefined,
      };

      console.log('📤 Sending Step 3 request:', request);
      await authService.registerSupplierStep3(request);
      setToast({
        type: 'success',
        message: 'Tải lên giấy tờ thành công! Vui lòng điền thông tin doanh nghiệp và cửa hàng.'
      });
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Tải lên giấy tờ thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // ===== STEP 4: Business and Store Information =====
  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError('Không tìm thấy Supplier ID. Vui lòng thực hiện lại bước 1.');
      return;
    }

    setLoading(true);
    try {
      const request: SupplierRegisterStep4Request = {
        ...step4Data,
        supplierId: supplierId,  // ✅ THÊM supplierId
        email: step1Data.email,
      };

      console.log('📤 Sending Step 4 request:', request);
      await authService.registerSupplierStep4(request);
      setToast({
        type: 'success',
        message: 'Đăng ký hoàn tất! Chúng tôi sẽ xem xét và phê duyệt đơn đăng ký của bạn trong 24-48 giờ. Bạn sẽ nhận được email thông báo khi tài khoản được kích hoạt.'
      });
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Hoàn tất đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER STEP PROGRESS =====
  const renderStepProgress = () => {
    const steps = [
      { number: 1, title: 'Tài khoản', icon: '👤' },
      { number: 2, title: 'Xác thực OTP', icon: '📧' },
      { number: 3, title: 'Giấy tờ', icon: '📄' },
      { number: 4, title: 'Thông tin', icon: '🏪' },
    ];

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                  currentStep >= step.number
                    ? 'bg-[#2F855A] text-white shadow-lg'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.number ? '✓' : step.icon}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  currentStep >= step.number ? 'text-[#2F855A]' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded transition-all ${
                  currentStep > step.number ? 'bg-[#2F855A]' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDE6] via-[#FFFEFA] to-[#E8FFED] py-8 px-4">
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#D9FFDF] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#DDC6B6] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#B7E4C7] rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="SaveFood Logo" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2F855A] to-[#A4C3A2] bg-clip-text text-transparent">
            Đăng ký trở thành đối tác SaveFood
          </h1>
          <p className="text-gray-600 mt-2">Bước {currentStep}/4 - {['Tạo tài khoản', 'Xác thực email', 'Tải lên giấy tờ', 'Thông tin doanh nghiệp'][currentStep - 1]}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {renderStepProgress()}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* STEP 1: Basic Account Registration */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={step1Data.username}
                  onChange={(e) => setStep1Data({ ...step1Data, username: e.target.value })}
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="[a-zA-Z0-9_]+"
                  title="Chỉ cho phép chữ cái, số và dấu gạch dưới"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="username123"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={step1Data.email}
                  onChange={(e) => setStep1Data({ ...step1Data, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Họ tên đầy đủ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={step1Data.fullName}
                  onChange={(e) => setStep1Data({ ...step1Data, fullName: e.target.value })}
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={step1Data.phoneNumber}
                  onChange={(e) => setStep1Data({ ...step1Data, phoneNumber: e.target.value })}
                  required
                  pattern="[0-9+]{10,15}"
                  title="Số điện thoại từ 10-15 số"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="0912345678"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={step1Data.password}
                    onChange={(e) => setStep1Data({ ...step1Data, password: e.target.value })}
                    required
                    minLength={8}
                    title="Tối thiểu 8 ký tự"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                    placeholder="********"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                    placeholder="********"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white rounded-xl hover:from-[#8FB491] hover:to-[#2F855A] font-semibold shadow-lg disabled:opacity-50 transition-all"
                >
                  {loading ? 'Đang xử lý...' : 'Tiếp theo'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Email OTP Verification */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#E8FFED] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">
                  Mã OTP đã được gửi đến email:<br />
                  <strong className="text-gray-900">{step1Data.email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                  Nhập mã OTP (6 số)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none text-center text-3xl tracking-widest font-bold"
                  placeholder="000000"
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-[#2F855A] hover:text-[#8FB491] font-semibold text-sm disabled:opacity-50"
                >
                  Gửi lại mã OTP
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white rounded-xl hover:from-[#8FB491] hover:to-[#2F855A] font-semibold shadow-lg disabled:opacity-50 transition-all"
                >
                  {loading ? 'Đang xác thực...' : 'Xác thực'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Document Upload */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số GPKD <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={step3Data.businessLicense}
                  onChange={(e) => setStep3Data({ ...step3Data, businessLicense: e.target.value })}
                  required
                  maxLength={50}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="0123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  File GPKD <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="businessLicenseFile"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'license')}
                  required
                  className="hidden"
                />
                {!licensePreview ? (
                  <label
                    htmlFor="businessLicenseFile"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#A4C3A2] hover:bg-[#E8FFED]/50 transition-all group"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[#E8FFED] rounded-full flex items-center justify-center mb-3 group-hover:bg-[#B7E4C7] transition-colors">
                        <svg className="w-8 h-8 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm text-[#2F855A] font-semibold mb-1">Click để upload GPKD</p>
                      <p className="text-xs text-gray-500">JPG, PNG hoặc PDF (tối đa 5MB)</p>
                    </div>
                  </label>
                ) : (
                  <div className="relative w-full h-40 border-2 border-[#B7E4C7] rounded-xl overflow-hidden bg-[#F8FFF9] group">
                    {step3Data.businessLicenseFile?.type === 'application/pdf' ? (
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-[#E8FFED] rounded-lg flex items-center justify-center mb-2">
                          <svg className="w-8 h-8 text-[#E63946]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-[#2D2D2D] mb-1">PDF Document</p>
                        <p className="text-xs text-gray-600 px-4 text-center truncate max-w-full">{licenseFileName}</p>
                      </div>
                    ) : (
                      <img src={licensePreview} alt="Preview" className="h-full w-full object-contain p-2" />
                    )}
                    {/* Overlay with filename and remove button */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-medium truncate mb-2">{licenseFileName}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile('license')}
                          className="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Xóa file
                        </button>
                      </div>
                    </div>
                    {/* Success badge */}
                    <div className="absolute top-2 right-2 bg-[#2F855A] text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Đã tải lên
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số chứng nhận ATTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={step3Data.foodSafetyCertificate}
                  onChange={(e) => setStep3Data({ ...step3Data, foodSafetyCertificate: e.target.value })}
                  required
                  maxLength={50}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="CERT-0123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  File chứng nhận ATTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="foodSafetyCertFile"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(e, 'cert')}
                  required
                  className="hidden"
                />
                {!certPreview ? (
                  <label
                    htmlFor="foodSafetyCertFile"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#A4C3A2] hover:bg-[#E8FFED]/50 transition-all group"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[#E8FFED] rounded-full flex items-center justify-center mb-3 group-hover:bg-[#B7E4C7] transition-colors">
                        <svg className="w-8 h-8 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-[#2F855A] font-semibold mb-1">Click để upload chứng nhận ATTP</p>
                      <p className="text-xs text-gray-500">JPG, PNG hoặc PDF (tối đa 5MB)</p>
                    </div>
                  </label>
                ) : (
                  <div className="relative w-full h-40 border-2 border-[#B7E4C7] rounded-xl overflow-hidden bg-[#F8FFF9] group">
                    {step3Data.foodSafetyCertificateFile?.type === 'application/pdf' ? (
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-[#E8FFED] rounded-lg flex items-center justify-center mb-2">
                          <svg className="w-8 h-8 text-[#E63946]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-[#2D2D2D] mb-1">PDF Document</p>
                        <p className="text-xs text-gray-600 px-4 text-center truncate max-w-full">{certFileName}</p>
                      </div>
                    ) : (
                      <img src={certPreview} alt="Preview" className="h-full w-full object-contain p-2" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-medium truncate mb-2">{certFileName}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile('cert')}
                          className="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Xóa file
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-[#2F855A] text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Đã tải lên
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Logo doanh nghiệp (Không bắt buộc)
                </label>
                <input
                  type="file"
                  id="avatarFile"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'avatar')}
                  className="hidden"
                />
                {!avatarPreview ? (
                  <label
                    htmlFor="avatarFile"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#A4C3A2] hover:bg-[#E8FFED]/50 transition-all group"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[#E8FFED] rounded-full flex items-center justify-center mb-3 group-hover:bg-[#B7E4C7] transition-colors">
                        <svg className="w-8 h-8 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-[#2F855A] font-semibold mb-1">Click để upload logo</p>
                      <p className="text-xs text-gray-500">JPG hoặc PNG (tối đa 5MB)</p>
                    </div>
                  </label>
                ) : (
                  <div className="relative w-full h-40 border-2 border-[#B7E4C7] rounded-xl overflow-hidden bg-[#F8FFF9] group">
                    <img src={avatarPreview} alt="Logo" className="h-full w-full object-contain p-2" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-medium truncate mb-2">{avatarFileName}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile('avatar')}
                          className="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Xóa file
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-[#2F855A] text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Đã tải lên
                    </div>
                  </div>
                )}
              </div>              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white rounded-xl hover:from-[#8FB491] hover:to-[#2F855A] font-semibold shadow-lg disabled:opacity-50 transition-all"
                >
                  {loading ? 'Đang tải lên...' : 'Tiếp theo'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Business and Store Information */}
          {currentStep === 4 && (
            <form onSubmit={handleStep4Submit} className="space-y-4">
              <div className="bg-gradient-to-r from-[#E8FFED] to-[#B7E4C7] rounded-xl p-4 mb-6">
                <h3 className="text-lg font-bold text-[#2D2D2D] flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                  Thông tin doanh nghiệp
                </h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên doanh nghiệp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={step4Data.businessName}
                  onChange={(e) => setStep4Data({ ...step4Data, businessName: e.target.value })}
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="Công ty TNHH ABC"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Loại hình kinh doanh <span className="text-red-500">*</span>
                </label>
                <select
                  value={step4Data.businessType}
                  onChange={(e) => setStep4Data({ ...step4Data, businessType: e.target.value as BusinessType })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                >
                  <option value="RESTAURANT">Nhà hàng</option>
                  <option value="GROCERY_STORE">Cửa hàng tạp hóa</option>
                  <option value="COFFEE_SHOP">Quán cà phê</option>
                  <option value="BAKERY">Tiệm bánh</option>
                  <option value="SUPERMARKET">Siêu thị</option>
                  <option value="CONVENIENCE_STORE">Cửa hàng tiện lợi</option>
                  <option value="DISTRIBUTOR">Nhà phân phối</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Địa chỉ doanh nghiệp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={step4Data.businessAddress}
                  onChange={(e) => setStep4Data({ ...step4Data, businessAddress: e.target.value })}
                  required
                  maxLength={255}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="123 Đường ABC, Quận 1, TP.HCM"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mã số thuế <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={step4Data.taxCode}
                  onChange={(e) => setStep4Data({ ...step4Data, taxCode: e.target.value })}
                  required
                  maxLength={20}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="0123456789"
                />
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 my-6">
                <h3 className="text-lg font-bold text-blue-900 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Thông tin cửa hàng đầu tiên
                </h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên cửa hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={step4Data.storeName}
                  onChange={(e) => setStep4Data({ ...step4Data, storeName: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="Chi nhánh 1"
                />
              </div>

              {/* Address Search with Google Maps Autocomplete */}
              <AddressAutocomplete
                value={step4Data.storeAddress}
                onChange={(address) => setStep4Data({ ...step4Data, storeAddress: address })}
                onPlaceSelected={(place) => {
                  setStep4Data({
                    ...step4Data,
                    storeAddress: place.address,
                    latitude: place.latitude.toString(),
                    longitude: place.longitude.toString(),
                  });
                }}
                label="Địa chỉ cửa hàng"
                placeholder="Nhập và chọn địa chỉ từ gợi ý..."
                required
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số điện thoại cửa hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={step4Data.storePhoneNumber}
                  onChange={(e) => setStep4Data({ ...step4Data, storePhoneNumber: e.target.value })}
                  required
                  pattern="0[0-9]{9}"
                  title="Số điện thoại Việt Nam (0xxxxxxxxx)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="0912345678"
                />
              </div>

              {/* Latitude & Longitude - Hidden but data still saved */}
              <input type="hidden" value={step4Data.latitude} required />
              <input type="hidden" value={step4Data.longitude} required />

              {step4Data.latitude && step4Data.longitude && (
                <div className="p-4 bg-[#E8FFED] border border-[#B7E4C7] rounded-xl">
                  <p className="text-sm text-[#2F855A] flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <strong>Vị trí đã được xác định!</strong>
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${step4Data.latitude},${step4Data.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2F855A] hover:text-[#2F855A] underline ml-7 mt-1 inline-block"
                  >
                    📍 Xem trên Google Maps →
                  </a>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô tả cửa hàng (Không bắt buộc)
                </label>
                <textarea
                  value={step4Data.storeDescription}
                  onChange={(e) => setStep4Data({ ...step4Data, storeDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="Mô tả ngắn về cửa hàng..."
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" required className="w-5 h-5 text-[#2F855A] rounded mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Tôi xác nhận rằng tất cả thông tin đã cung cấp là chính xác và đồng ý với{' '}
                    <a href="#" className="text-[#2F855A] font-semibold hover:underline">Điều khoản</a> và{' '}
                    <a href="#" className="text-[#2F855A] font-semibold hover:underline">Chính sách</a> của SaveFood
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white rounded-xl hover:from-[#8FB491] hover:to-[#2F855A] font-semibold shadow-lg disabled:opacity-50 transition-all"
                >
                  {loading ? 'Đang hoàn tất...' : 'Hoàn tất đăng ký'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#2F855A] hover:text-[#8FB491] font-semibold"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}} />
    </div>
  );
};

export default Registration;
