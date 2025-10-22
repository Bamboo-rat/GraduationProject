import React, { useState } from 'react';
import authService, {
  type SupplierRegisterStep1Request,
  type SupplierRegisterStep2Request,
  type SupplierRegisterStep3Request,
  type SupplierRegisterStep4Request,
  type BusinessType
} from '../service/authService';
import fileStorageService from '../service/fileStorageService';

interface SupplierRegistrationFormProps {
  onClose: () => void;
}

type RegistrationStep = 1 | 2 | 3 | 4;

const SupplierRegistrationForm: React.FC<SupplierRegistrationFormProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 data
  const [step1Data, setStep1Data] = useState<SupplierRegisterStep1Request>({
    username: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [supplierId, setSupplierId] = useState<string>(''); // Store supplier ID from Step 1

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

  // Step 4 data
  const [step4Data, setStep4Data] = useState({
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
      console.log('Step 1 response:', response); // Debug log
      console.log('User ID from response:', response.userId); // Debug log

      if (!response.userId) {
        setError('Lỗi: Không nhận được ID người dùng từ server. Vui lòng thử lại.');
        console.error('userId is missing in Step 1 response');
        return;
      }

      setSupplierId(response.userId); // Save supplier ID for subsequent steps
      console.log('SupplierId saved to state:', response.userId); // Debug log

      alert(`Đăng ký thành công! Mã OTP đã được gửi đến email ${step1Data.email}`);
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

    // Validate supplierId is present
    if (!supplierId) {
      setError('Lỗi: Không tìm thấy ID người dùng. Vui lòng đăng ký lại từ bước 1.');
      console.error('SupplierId is empty in Step 2');
      return;
    }

    setLoading(true);
    try {
      const request: SupplierRegisterStep2Request = {
        supplierId: supplierId,
        email: step1Data.email,
        otp: otp,
      };

      console.log('Step 2 request:', request); // Debug log

      await authService.registerSupplierStep2(request);
      alert('Xác thực email thành công! Vui lòng tải lên các giấy tờ cần thiết.');
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Xác thực OTP thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!supplierId) {
      setError('Lỗi: Không tìm thấy ID người dùng. Vui lòng đăng ký lại từ bước 1.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authService.resendSupplierOtp(supplierId);
      alert('Mã OTP mới đã được gửi đến email của bạn!');
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
      } else if (fileType === 'cert') {
        setStep3Data(prev => ({ ...prev, foodSafetyCertificateFile: file }));
        setCertPreview(preview);
      } else {
        setStep3Data(prev => ({ ...prev, avatarFile: file }));
        setAvatarPreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!step3Data.businessLicenseFile || !step3Data.foodSafetyCertificateFile) {
      setError('Vui lòng tải lên đầy đủ giấy tờ bắt buộc (GPKD và Chứng nhận ATTP)');
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
        supplierId: supplierId,
        email: step1Data.email,
        businessLicense: step3Data.businessLicense,
        businessLicenseUrl: licenseUrl,
        foodSafetyCertificate: step3Data.foodSafetyCertificate,
        foodSafetyCertificateUrl: certUrl,
        avatarUrl: avatarUrl || undefined,
      };

      await authService.registerSupplierStep3(request);
      alert('Tải lên giấy tờ thành công! Vui lòng điền thông tin doanh nghiệp và cửa hàng.');
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

    setLoading(true);
    try {
      const request: SupplierRegisterStep4Request = {
        ...step4Data,
        supplierId: supplierId,
        email: step1Data.email,
      };

      await authService.registerSupplierStep4(request);
      alert('Đăng ký hoàn tất! Chúng tôi sẽ xem xét và phê duyệt đơn đăng ký của bạn trong 24-48 giờ. Bạn sẽ nhận được email thông báo khi tài khoản được kích hoạt.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Hoàn tất đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER STEP PROGRESS =====
  const renderStepProgress = () => {
    const steps = [
      { number: 1, title: 'Tài khoản' },
      { number: 2, title: 'Xác thực OTP' },
      { number: 3, title: 'Giấy tờ' },
      { number: 4, title: 'Thông tin' },
    ];

    return (
      <div className="flex justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                currentStep >= step.number
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step.number}
              </div>
              <span className={`text-xs mt-2 ${
                currentStep >= step.number ? 'text-green-600 font-semibold' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 ${
                currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-2xl flex justify-between items-center z-10">
            <div>
              <h2 className="text-2xl font-bold text-white">Đăng ký trở thành đối tác</h2>
              <p className="text-green-50 text-sm mt-1">Bước {currentStep}/4</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {renderStepProgress()}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
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
                      title="Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                      placeholder="********"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Tiếp theo'}
                </button>
              </form>
            )}

            {/* STEP 2: Email OTP Verification */}
            {currentStep === 2 && (
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    Mã OTP đã được gửi đến email: <strong>{step1Data.email}</strong>
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-green-600 hover:text-green-700 font-semibold text-sm"
                  >
                    Gửi lại mã OTP
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg disabled:opacity-50"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
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
                  <label
                    htmlFor="businessLicenseFile"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all"
                  >
                    {licensePreview ? (
                      <img src={licensePreview} alt="Preview" className="h-full object-contain" />
                    ) : (
                      <>
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-600">Click để upload GPKD</p>
                      </>
                    )}
                  </label>
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
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
                  <label
                    htmlFor="foodSafetyCertFile"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all"
                  >
                    {certPreview ? (
                      <img src={certPreview} alt="Preview" className="h-full object-contain" />
                    ) : (
                      <>
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-600">Click để upload chứng nhận ATTP</p>
                      </>
                    )}
                  </label>
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
                  <label
                    htmlFor="avatarFile"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Logo" className="h-full object-contain" />
                    ) : (
                      <>
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-600">Click để upload logo</p>
                      </>
                    )}
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Đang tải lên...' : 'Tiếp theo'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Business and Store Information */}
            {currentStep === 4 && (
              <form onSubmit={handleStep4Submit} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Thông tin doanh nghiệp</h3>

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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                    placeholder="0123456789"
                  />
                </div>

                <h3 className="text-lg font-bold text-gray-900 pt-4">Thông tin cửa hàng đầu tiên</h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tên cửa hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={step4Data.storeName}
                    onChange={(e) => setStep4Data({ ...step4Data, storeName: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                    placeholder="Chi nhánh 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Địa chỉ cửa hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={step4Data.storeAddress}
                    onChange={(e) => setStep4Data({ ...step4Data, storeAddress: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                    placeholder="456 Đường XYZ, Quận 2, TP.HCM"
                  />
                </div>

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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                    placeholder="0912345678"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vĩ độ (Latitude) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={step4Data.latitude}
                      onChange={(e) => setStep4Data({ ...step4Data, latitude: e.target.value })}
                      required
                      pattern="^-?([1-8]?[0-9]\.{1}\d+|90\.{1}0+)$"
                      title="Vĩ độ hợp lệ (VD: 10.762622)"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                      placeholder="10.762622"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kinh độ (Longitude) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={step4Data.longitude}
                      onChange={(e) => setStep4Data({ ...step4Data, longitude: e.target.value })}
                      required
                      pattern="^-?((1[0-7]|[0-9])?[0-9]\.{1}\d+|180\.{1}0+)$"
                      title="Kinh độ hợp lệ (VD: 106.660172)"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                      placeholder="106.660172"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả cửa hàng (Không bắt buộc)
                  </label>
                  <textarea
                    value={step4Data.storeDescription}
                    onChange={(e) => setStep4Data({ ...step4Data, storeDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                    placeholder="Mô tả ngắn về cửa hàng..."
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" required className="w-5 h-5 text-green-600 rounded mt-0.5" />
                    <span className="text-sm text-gray-700">
                      Tôi xác nhận rằng tất cả thông tin đã cung cấp là chính xác và đồng ý với{' '}
                      <a href="#" className="text-green-600 font-semibold">Điều khoản</a> và{' '}
                      <a href="#" className="text-green-600 font-semibold">Chính sách</a> của SaveFood
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Đang hoàn tất...' : 'Hoàn tất đăng ký'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierRegistrationForm;
