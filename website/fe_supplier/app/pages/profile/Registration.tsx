import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import authService from '../../service/authService';
import locationService from '../../service/locationService';
import { 
  MapPin, 
  Mail, 
  Upload, 
  FileText, 
  Image, 
  X, 
  Check, 
  Building, 
  Store,
  User,
  Phone,
  Lock,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import type {
  SupplierRegisterStep1Request,
  SupplierRegisterStep2Request,
  SupplierRegisterStep3Request,
  SupplierRegisterStep4Request,
  BusinessType
} from '../../types/supplierAuthTypes';
import fileStorageService from '../../service/fileStorageService';
import AddressAutocomplete from '../../component/features/AddressAutocomplete';
import Toast from '../../component/common/Toast';
import type { ToastType } from '../../component/common/Toast';
import logo from '~/assets/image/logo.png';
import { useFormProtection } from '~/utils/useFormProtection';
import { useRegistrationPersistence } from '~/hooks/useRegistrationPersistence';

type RegistrationStep = 1 | 2 | 3 | 4;

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const { saveDraft, getDraft, clearDraft, hasDraft, getLastSavedTime } = useRegistrationPersistence();
  
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

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
    storeStreet: '',
    storeWard: '',
    storeDistrict: '',
    storeProvince: '',
    storePhoneNumber: '',
    latitude: '',
    longitude: '',
    storeDescription: '',
  });

  // State cho dropdown địa chỉ
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Track if form is dirty (has unsaved changes)
  const isDirty = useMemo(() => {
    return (
      currentStep > 1 || // Already started registration
      step1Data.username !== '' ||
      step1Data.email !== '' ||
      step1Data.fullName !== '' ||
      step1Data.phoneNumber !== '' ||
      step1Data.password !== '' ||
      step3Data.businessLicense !== '' ||
      step3Data.avatarUrl !== '' ||
      step4Data.businessName !== '' ||
      step4Data.storeName !== ''
    );
  }, [currentStep, step1Data, step3Data, step4Data]);

  // Restore form data from backup
  const restoreFormData = (backup: any) => {
    if (backup.currentStep) setCurrentStep(backup.currentStep);
    if (backup.step1Data) setStep1Data(backup.step1Data);
    if (backup.supplierId) setSupplierId(backup.supplierId);
    if (backup.step3Data) {
      setStep3Data(backup.step3Data);
      if (backup.step3Data.businessLicenseUrl) setLicensePreview(backup.step3Data.businessLicenseUrl);
      if (backup.step3Data.foodSafetyCertificateUrl) setCertPreview(backup.step3Data.foodSafetyCertificateUrl);
      if (backup.step3Data.avatarUrl) setAvatarPreview(backup.step3Data.avatarUrl);
    }
    if (backup.step4Data) setStep4Data(backup.step4Data);
    setToast({ type: 'success', message: 'Đã khôi phục dữ liệu đăng ký chưa hoàn thành' });
  };

  // Form protection hook
  const { clearBackup } = useFormProtection({
    formData: {
      currentStep,
      step1Data,
      supplierId,
      step3Data: {
        businessLicense: step3Data.businessLicense,
        businessLicenseUrl: step3Data.businessLicenseUrl,
        foodSafetyCertificate: step3Data.foodSafetyCertificate,
        foodSafetyCertificateUrl: step3Data.foodSafetyCertificateUrl,
        avatarUrl: step3Data.avatarUrl,
      },
      step4Data,
    },
    isDirty,
    storageKey: 'supplier-registration-backup',
    autoSaveInterval: 30000, // 30 seconds
    onRestore: restoreFormData,
  });

  // Auto-save draft to localStorage on data change
  useEffect(() => {
    if (isDirty) {
      saveDraft({
        currentStep,
        supplierId,
        step1Data,
        step3Data: {
          businessLicense: step3Data.businessLicense,
          businessLicenseUrl: step3Data.businessLicenseUrl,
          foodSafetyCertificate: step3Data.foodSafetyCertificate,
          foodSafetyCertificateUrl: step3Data.foodSafetyCertificateUrl,
          avatarUrl: step3Data.avatarUrl,
        },
        step4Data: {
          businessName: step4Data.businessName,
          businessType: step4Data.businessType as string,
          taxCode: step4Data.taxCode,
          businessAddress: step4Data.businessAddress,
          province: '',
          district: '',
          ward: '',
          bankName: '',
          bankAccountNumber: '',
          bankAccountName: '',
          storeName: step4Data.storeName,
          storeAddress: step4Data.storeAddress,
          storeProvince: step4Data.storeProvince,
          storeDistrict: step4Data.storeDistrict,
          storeWard: step4Data.storeWard,
          email: step4Data.email,
          storeStreet: step4Data.storeStreet,
          storePhoneNumber: step4Data.storePhoneNumber,
          latitude: step4Data.latitude,
          longitude: step4Data.longitude,
          storeDescription: step4Data.storeDescription,
        },
        uploadedFiles: {
          license: step3Data.businessLicenseUrl,
          certificate: step3Data.foodSafetyCertificateUrl,
          avatar: step3Data.avatarUrl,
        },
        lastSaved: new Date().toISOString(),
      });
    }
  }, [currentStep, supplierId, step1Data, step3Data, step4Data, isDirty, saveDraft]);

  // Restore draft on mount
  useEffect(() => {
    if (hasDraft()) {
      const draft = getDraft();
      if (draft) {
        const shouldRestore = window.confirm(
          `Bạn có đăng ký dở dang từ ${getLastSavedTime()}.\n\n` +
          `Bước hiện tại: Bước ${draft.currentStep}/4\n` +
          `Bạn có muốn tiếp tục không?`
        );

        if (shouldRestore) {
          // Restore all data
          setCurrentStep(draft.currentStep as RegistrationStep);
          setSupplierId(draft.supplierId || '');
          setStep1Data(draft.step1Data);
          setStep3Data(prev => ({
            ...prev,
            businessLicense: draft.step3Data?.businessLicense || '',
            businessLicenseUrl: draft.step3Data?.businessLicenseUrl || '',
            foodSafetyCertificate: draft.step3Data?.foodSafetyCertificate || '',
            foodSafetyCertificateUrl: draft.step3Data?.foodSafetyCertificateUrl || '',
            avatarUrl: draft.step3Data?.avatarUrl || '',
          }));
          
          // Merge with default step4Data to ensure all required fields exist
          setStep4Data(prev => ({
            ...prev,
            ...draft.step4Data,
            businessType: (draft.step4Data.businessType || 'RESTAURANT') as BusinessType,
          }));
          
          // Restore file previews if URLs exist
          if (draft.uploadedFiles?.license) {
            setLicensePreview(draft.uploadedFiles.license);
          }
          if (draft.uploadedFiles?.certificate) {
            setCertPreview(draft.uploadedFiles.certificate);
          }
          if (draft.uploadedFiles?.avatar) {
            setAvatarPreview(draft.uploadedFiles.avatar);
          }

          setToast({
            type: 'success',
            message: 'Đã khôi phục tiến trình đăng ký của bạn!'
          });
        } else {
          clearDraft();
        }
      }
    }
  }, []); // Run only once on mount

  // Warn user before leaving page if they have unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if in the middle of registration (not at step 1 or completed)
      if (currentStep > 1 && isDirty) {
        e.preventDefault();
        e.returnValue = 'Bạn có dữ liệu đăng ký chưa hoàn tất. Bạn có chắc muốn rời khỏi trang?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep, isDirty]);

  // Lấy danh sách tỉnh/thành khi mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingLocation(true);
      try {
        const data = await locationService.getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error('Error fetching provinces:', error);
        setProvinces([]);
      } finally {
        setLoadingLocation(false);
      }
    };
    fetchProvinces();
  }, []);

  // Lấy quận/huyện khi chọn tỉnh
  useEffect(() => {
    if (!step4Data.storeProvince) {
      setDistricts([]);
      setStep4Data(prev => ({ ...prev, storeDistrict: '', storeWard: '' }));
      return;
    }

    const fetchDistricts = async () => {
      setLoadingLocation(true);
      try {
        const province = provinces.find(p => p.name === step4Data.storeProvince);
        if (!province) return;

        const data = await locationService.getDistricts(province.code);
        setDistricts(data);
      } catch (error) {
        console.error('Error fetching districts:', error);
        setDistricts([]);
      } finally {
        setLoadingLocation(false);
      }
    };
    fetchDistricts();
  }, [step4Data.storeProvince, provinces]);

  // Lấy phường/xã khi chọn quận/huyện
  useEffect(() => {
    if (!step4Data.storeDistrict) {
      setWards([]);
      setStep4Data(prev => ({ ...prev, storeWard: '' }));
      return;
    }

    const fetchWards = async () => {
      setLoadingLocation(true);
      try {
        const district = districts.find(d => d.name === step4Data.storeDistrict);
        if (!district) return;

        const data = await locationService.getWards(district.code);
        setWards(data);
      } catch (error) {
        console.error('Error fetching wards:', error);
        setWards([]);
      } finally {
        setLoadingLocation(false);
      }
    };
    fetchWards();
  }, [step4Data.storeDistrict, districts]);

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
      }

      setToast({
        type: 'success',
        message: `Đăng ký thành công! Mã OTP đã được gửi đến email ${step1Data.email}`
      });
      setCurrentStep(2);
    } catch (err: any) {
      const errorMessage = err.response?.data?.vietnameseMessage || 
                          err.response?.data?.message || 
                          err.message || 
                          'Đăng ký thất bại!';
      setError(errorMessage);
      console.error('Step 1 error:', err.response?.data || err);
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
      await authService.registerSupplierStep2(request);
      setToast({
        type: 'success',
        message: 'Xác thực email thành công! Vui lòng tải lên các giấy tờ cần thiết.'
      });
      setCurrentStep(3);
    } catch (err: any) {
      const errorMessage = err.response?.data?.vietnameseMessage || 
                          err.response?.data?.message || 
                          err.message || 
                          'Xác thực OTP thất bại!';
      setError(errorMessage);
      console.error('Step 2 error:', err.response?.data || err);
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
      const errorMessage = err.response?.data?.vietnameseMessage || 
                          err.response?.data?.message || 
                          err.message || 
                          'Gửi lại OTP thất bại!';
      setError(errorMessage);
      console.error('Resend OTP error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // ===== STEP 3: Document Upload =====
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'license' | 'cert' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = fileStorageService.validateFile(file, 5, ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']);
    if (!validation.valid) {
      setError(validation.error || 'File không hợp lệ');
      return;
    }

    // Show local preview immediately for instant feedback
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (fileType === 'license') {
        setLicensePreview(preview);
        setLicenseFileName(file.name);
      } else if (fileType === 'cert') {
        setCertPreview(preview);
        setCertFileName(file.name);
      } else {
        setAvatarPreview(preview);
        setAvatarFileName(file.name);
      }
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary immediately in background
    setLoading(true);
    try {
      let uploadedUrl = '';
      
      if (fileType === 'license') {
        uploadedUrl = await fileStorageService.uploadBusinessLicense(file);
        setStep3Data(prev => ({ 
          ...prev, 
          businessLicenseFile: file,
          businessLicenseUrl: uploadedUrl 
        }));
        setToast({ 
          type: 'success', 
          message: '✅ Upload Giấy phép kinh doanh thành công!' 
        });
      } else if (fileType === 'cert') {
        uploadedUrl = await fileStorageService.uploadFoodSafetyCertificate(file);
        setStep3Data(prev => ({ 
          ...prev, 
          foodSafetyCertificateFile: file,
          foodSafetyCertificateUrl: uploadedUrl 
        }));
        setToast({ 
          type: 'success', 
          message: '✅ Upload Chứng nhận ATTP thành công!' 
        });
      } else {
        uploadedUrl = await fileStorageService.uploadSupplierLogo(file);
        setStep3Data(prev => ({ 
          ...prev, 
          avatarFile: file,
          avatarUrl: uploadedUrl 
        }));
        setToast({ 
          type: 'success', 
          message: '✅ Upload logo doanh nghiệp thành công!' 
        });
      }
    } catch (err: any) {
      console.error('Upload file error:', err);
      setError(`Upload file thất bại: ${err.message || 'Vui lòng thử lại'}`);
      // Revert preview on error
      if (fileType === 'license') {
        setLicensePreview(null);
        setLicenseFileName('');
      } else if (fileType === 'cert') {
        setCertPreview(null);
        setCertFileName('');
      } else {
        setAvatarPreview(null);
        setAvatarFileName('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (fileType: 'license' | 'cert' | 'avatar') => {
    if (fileType === 'license') {
      setStep3Data(prev => ({ 
        ...prev, 
        businessLicenseFile: null,
        businessLicenseUrl: '' 
      }));
      setLicensePreview(null);
      setLicenseFileName('');
    } else if (fileType === 'cert') {
      setStep3Data(prev => ({ 
        ...prev, 
        foodSafetyCertificateFile: null,
        foodSafetyCertificateUrl: '' 
      }));
      setCertPreview(null);
      setCertFileName('');
    } else {
      setStep3Data(prev => ({ 
        ...prev, 
        avatarFile: null,
        avatarUrl: '' 
      }));
      setAvatarPreview(null);
      setAvatarFileName('');
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if files have been uploaded (URLs should exist)
    if (!step3Data.businessLicenseUrl || !step3Data.foodSafetyCertificateUrl) {
      setError('Vui lòng tải lên đầy đủ giấy tờ bắt buộc (GPKD và Chứng nhận ATTP)');
      return;
    }

    if (!supplierId) {
      setError('Không tìm thấy Supplier ID. Vui lòng thực hiện lại bước 1.');
      return;
    }

    setLoading(true);
    try {
      // Files are already uploaded to Cloudinary, just submit the URLs
      const request: SupplierRegisterStep3Request = {
        supplierId: supplierId,
        email: step1Data.email,
        businessLicense: step3Data.businessLicense,
        businessLicenseUrl: step3Data.businessLicenseUrl,
        foodSafetyCertificate: step3Data.foodSafetyCertificate,
        foodSafetyCertificateUrl: step3Data.foodSafetyCertificateUrl,
        avatarUrl: step3Data.avatarUrl || undefined,
      };

      await authService.registerSupplierStep3(request);
      setToast({
        type: 'success',
        message: '✅ Xác nhận giấy tờ thành công! Vui lòng điền thông tin doanh nghiệp và cửa hàng.'
      });
      setCurrentStep(4);
    } catch (err: any) {
      const errorMessage = err.response?.data?.vietnameseMessage || 
                          err.response?.data?.message || 
                          err.message || 
                          'Tải lên giấy tờ thất bại!';
      setError(errorMessage);
      console.error('Step 3 error:', err.response?.data || err);
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
        supplierId: supplierId,
        email: step1Data.email,
      };

      await authService.registerSupplierStep4(request);
      setToast({
        type: 'success',
        message: 'Đăng ký hoàn tất! Chúng tôi sẽ xem xét và phê duyệt đơn đăng ký của bạn trong 24-48 giờ. Bạn sẽ nhận được email thông báo khi tài khoản được kích hoạt.'
      });
      
      // Clear all backups after successful registration
      clearBackup();
      clearDraft();
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.vietnameseMessage || 
                          err.response?.data?.message || 
                          err.message || 
                          'Hoàn tất đăng ký thất bại!';
      setError(errorMessage);
      console.error('Step 4 error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER STEP PROGRESS =====
  const renderStepProgress = () => {
    const steps = [
      { number: 1, title: 'Tài khoản', icon: <User className="w-5 h-5" /> },
      { number: 2, title: 'Xác thực OTP', icon: <Mail className="w-5 h-5" /> },
      { number: 3, title: 'Giấy tờ', icon: <FileText className="w-5 h-5" /> },
      { number: 4, title: 'Thông tin', icon: <Store className="w-5 h-5" /> },
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
                  {currentStep > step.number ? <Check className="w-5 h-5" /> : step.icon}
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
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
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
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white rounded-xl hover:from-[#8FB491] hover:to-[#2F855A] font-semibold shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Đang xử lý...' : 'Tiếp theo'}
                  {!loading && <Check className="w-4 h-4" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Email OTP Verification */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#E8FFED] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-[#2F855A]" />
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
                  className="text-[#2F855A] hover:text-[#8FB491] font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-1 mx-auto"
                >
                  <Mail className="w-4 h-4" />
                  Gửi lại mã OTP
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white rounded-xl hover:from-[#8FB491] hover:to-[#2F855A] font-semibold shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Đang xác thực...' : 'Xác thực'}
                  {!loading && <Check className="w-4 h-4" />}
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
                        <Upload className="w-8 h-8 text-[#2F855A]" />
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
                          <FileText className="w-8 h-8 text-[#E63946]" />
                        </div>
                        <p className="text-sm font-medium text-[#2D2D2D] mb-1">PDF Document</p>
                        <p className="text-xs text-gray-600 px-4 text-center truncate max-w-full">{licenseFileName}</p>
                      </div>
                    ) : (
                      <img src={licensePreview} alt="Preview" className="h-full w-full object-contain p-2" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs font-medium truncate mb-2">{licenseFileName}</p>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile('license')}
                          className="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Xóa file
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-[#2F855A] text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
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
                        <FileText className="w-8 h-8 text-[#2F855A]" />
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
                          <FileText className="w-8 h-8 text-[#E63946]" />
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
                          <X className="w-4 h-4" />
                          Xóa file
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-[#2F855A] text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
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
                        <Image className="w-8 h-8 text-[#2F855A]" />
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
                          <X className="w-4 h-4" />
                          Xóa file
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-[#2F855A] text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Đã tải lên
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white rounded-xl hover:from-[#8FB491] hover:to-[#2F855A] font-semibold shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Đang tải lên...' : 'Tiếp theo'}
                  {!loading && <Check className="w-4 h-4" />}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Business and Store Information */}
          {currentStep === 4 && (
            <form onSubmit={handleStep4Submit} className="space-y-4">
              <div className="bg-gradient-to-r from-[#E8FFED] to-[#B7E4C7] rounded-xl p-4 mb-6">
                <h3 className="text-lg font-bold text-[#2D2D2D] flex items-center">
                  <Building className="w-5 h-5 mr-2" />
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
                  <Store className="w-5 h-5 mr-2" />
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

              {/* Address Autocomplete */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Địa chỉ cửa hàng <span className="text-red-500">*</span>
                </label>
                <AddressAutocomplete
                  value={step4Data.storeAddress}
                  onChange={(value) => setStep4Data(prev => ({ ...prev, storeAddress: value }))}
                  onPlaceSelected={(place) => {
                    setStep4Data(prev => ({
                      ...prev,
                      storeAddress: place.address,
                      latitude: place.latitude.toString(),
                      longitude: place.longitude.toString(),
                    }));
                  }}
                  placeholder="Nhập địa chỉ cửa hàng để tìm kiếm..."
                  required
                />
              </div>

              {/* Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Province */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tỉnh/Thành phố <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={step4Data.storeProvince}
                    onChange={e => setStep4Data(prev => ({
                      ...prev,
                      storeProvince: e.target.value,
                      storeDistrict: '',
                      storeWard: ''
                    }))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                    disabled={loadingLocation}
                  >
                    <option value="">{loadingLocation ? 'Đang tải...' : 'Chọn tỉnh/thành'}</option>
                    {provinces.map((p: any) => (
                      <option key={p.code} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quận/Huyện <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={step4Data.storeDistrict}
                    onChange={e => setStep4Data(prev => ({
                      ...prev,
                      storeDistrict: e.target.value,
                      storeWard: ''
                    }))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                    disabled={!step4Data.storeProvince || loadingLocation}
                  >
                    <option value="">
                      {loadingLocation ? 'Đang tải...' : !step4Data.storeProvince ? 'Chọn tỉnh trước' : 'Chọn quận/huyện'}
                    </option>
                    {districts.map((d: any) => (
                      <option key={d.code} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phường/Xã <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={step4Data.storeWard}
                    onChange={e => setStep4Data(prev => ({ ...prev, storeWard: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                    disabled={!step4Data.storeDistrict || loadingLocation}
                  >
                    <option value="">
                      {loadingLocation ? 'Đang tải...' : !step4Data.storeDistrict ? 'Chọn quận trước' : 'Chọn phường/xã'}
                    </option>
                    {wards.map((w: any) => (
                      <option key={w.code} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Street */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số nhà, tên đường <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={step4Data.storeStreet}
                  onChange={e => setStep4Data(prev => ({ ...prev, storeStreet: e.target.value }))}
                  required
                  maxLength={255}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2]/30 transition-all outline-none"
                  placeholder="Số nhà, tên đường..."
                />
              </div>

              {/* Coordinates Display */}
              {step4Data.latitude && step4Data.longitude && (
                <div className="p-4 bg-[#E8FFED] border border-[#B7E4C7] rounded-xl">
                  <p className="text-sm text-[#2F855A] flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <strong>Vị trí đã được xác định!</strong>
                  </p>
                  <p className="text-xs text-[#2F855A] ml-6 mt-1">
                    Tọa độ: {step4Data.latitude}, {step4Data.longitude}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${step4Data.latitude},${step4Data.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2F855A] hover:text-[#2F855A] underline ml-6 mt-1 inline-block"
                  >
                    📍 Xem trên Google Maps →
                  </a>
                </div>
              )}

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
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white rounded-xl hover:from-[#8FB491] hover:to-[#2F855A] font-semibold shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? 'Đang hoàn tất...' : 'Hoàn tất đăng ký'}
                  {!loading && <Check className="w-4 h-4" />}
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
      <style dangerouslySetInnerHTML={{
        __html: `
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