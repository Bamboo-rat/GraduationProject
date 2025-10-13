import React, { useState } from 'react';
import logo from '../assets/image/logomini-removebg.png';

interface SupplierRegistrationFormProps {
  onClose: () => void;
}

const SupplierRegistrationForm: React.FC<SupplierRegistrationFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: '',
    businessName: '',
    businessLicense: '',
    businessLicenseFile: null as File | null,
    taxCode: '',
    businessType: 'RESTAURANT' as 'RESTAURANT' | 'GROCERY' | 'CAFE' | 'BAKERY' | 'SUPERMARKET' | 'OTHER',
    logo: null as File | null,
  });

  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileType = e.target.name as 'businessLicenseFile' | 'logo';
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [fileType]: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (fileType === 'businessLicenseFile') {
          setLicensePreview(reader.result as string);
        } else {
          setLogoPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('businessName', formData.businessName);
      formDataToSend.append('businessLicense', formData.businessLicense);
      formDataToSend.append('taxCode', formData.taxCode);
      formDataToSend.append('businessType', formData.businessType);
      
      if (formData.businessLicenseFile) {
        formDataToSend.append('businessLicenseFile', formData.businessLicenseFile);
      }
      if (formData.logo) {
        formDataToSend.append('logo', formData.logo);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Đăng ký thành công! Chúng tôi sẽ xem xét và liên hệ với bạn trong 24-48 giờ.');
      onClose();
    } catch (error) {
      console.error('Registration error:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          
          <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-2xl flex justify-between items-center z-10">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="FoodSave" className="h-10 w-10 object-contain bg-white rounded-lg p-1" />
              <div>
                <h2 className="text-2xl font-bold text-white">Đăng ký trở thành đối tác</h2>
                <p className="text-green-50 text-sm mt-1">Điền thông tin để tham gia FoodSave</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên doanh nghiệp <span className="text-red-500">*</span>
              </label>
              <input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                placeholder="Nhà hàng ABC" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Loại hình kinh doanh <span className="text-red-500">*</span>
              </label>
              <select name="businessType" value={formData.businessType} onChange={handleInputChange} required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none">
                <option value="RESTAURANT">Nhà hàng</option>
                <option value="GROCERY">Cửa hàng tạp hóa</option>
                <option value="CAFE">Quán cà phê</option>
                <option value="BAKERY">Tiệm bánh</option>
                <option value="SUPERMARKET">Siêu thị</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Họ tên người đại diện <span className="text-red-500">*</span>
              </label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                placeholder="Nguyễn Văn A" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                  placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                  placeholder="0912345678" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu <span className="text-red-500">*</span></label>
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required minLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                  placeholder="Tối thiểu 6 ký tự" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                  placeholder="Nhập lại mật khẩu" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ <span className="text-red-500">*</span></label>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                placeholder="Số nhà, đường, quận, TP" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số GPKD <span className="text-red-500">*</span></label>
                <input type="text" name="businessLicense" value={formData.businessLicense} onChange={handleInputChange} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                  placeholder="0123456789" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mã số thuế <span className="text-red-500">*</span></label>
                <input type="text" name="taxCode" value={formData.taxCode} onChange={handleInputChange} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none"
                  placeholder="0123456789-001" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">File GPKD <span className="text-red-500">*</span></label>
              <input type="file" id="businessLicenseFile" name="businessLicenseFile" accept="image/*,.pdf" onChange={handleFileChange} required className="hidden" />
              <label htmlFor="businessLicenseFile" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all">
                {licensePreview ? (
                  <img src={licensePreview} alt="Preview" className="h-full object-contain" />
                ) : (
                  <>
                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600">Click để upload</p>
                  </>
                )}
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Logo (Không bắt buộc)</label>
              <input type="file" id="logo" name="logo" accept="image/*" onChange={handleFileChange} className="hidden" />
              <label htmlFor="logo" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50/50 transition-all">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full object-contain" />
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

            <div className="bg-gray-50 rounded-xl p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input type="checkbox" required className="w-5 h-5 text-green-600 rounded mt-0.5" />
                <span className="text-sm text-gray-700">
                  Tôi đồng ý với <a href="#" className="text-green-600 font-semibold">Điều khoản</a> và <a href="#" className="text-green-600 font-semibold">Chính sách</a> của FoodSave
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold">
                Hủy
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-lg disabled:opacity-50">
                {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupplierRegistrationForm;
