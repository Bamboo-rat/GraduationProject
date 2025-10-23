import React from 'react';
import type { Supplier } from '~/service/supplierService';

interface SupplierPendingDetailProps {
  show: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onApprove: (supplier: Supplier) => void;
  onReject: (supplier: Supplier) => void;
}

export default function SupplierPendingDetail({
  show,
  supplier,
  onClose,
  onApprove,
  onReject,
}: SupplierPendingDetailProps) {
  if (!show || !supplier) return null;

  // Detect if a URL is a PDF file
  const isPdfFile = (fileUrl: string | null | undefined): boolean => {
    if (!fileUrl) return false;
    const url = fileUrl.toLowerCase();
    return url.endsWith('.pdf') || url.includes('/raw/upload/') || url.includes('/pdf') || url.includes('_pdf');
  };

  // Get document file URL
  const getFileUrl = (fileUrl: string | null | undefined): string | null => {
    if (!fileUrl) return null;

    try {
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        if (isPdfFile(fileUrl) && fileUrl.includes('res.cloudinary.com') && !fileUrl.includes('/fl_')) {
          const urlParts = fileUrl.split('/upload/');
          if (urlParts.length === 2) {
            return `${urlParts[0]}/upload/fl_attachment:document/${urlParts[1]}`;
          }
        }
        return fileUrl;
      }

      const cloudName = 'dk7coitah';
      let publicId = fileUrl.replace(/^cloudinary:\/\//, '');
      const isPdf = publicId.toLowerCase().includes('.pdf') || publicId.toLowerCase().includes('pdf');
      const resourceType = isPdf ? 'raw' : 'image';
      const cleanPublicId = publicId.replace(/\.(jpg|jpeg|png|gif|pdf|webp)$/i, '');

      return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cleanPublicId}`;
    } catch (error) {
      console.error('Error processing file URL:', error, 'Original URL:', fileUrl);
      return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white shadow-xl overflow-hidden border-4 border-white border-opacity-30">
                <img
                  src={supplier.avatarUrl || 'https://via.placeholder.com/96'}
                  alt={supplier.businessName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{supplier.businessName}</h2>
                <div className="flex items-center gap-3 text-green-100">
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm font-medium">
                    {supplier.businessType || 'Doanh nghiệp'}
                  </span>
                  <span className="text-sm">•</span>
                  <span className="font-mono">MST: {supplier.taxCode}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-white hover:bg-opacity-20 rounded-xl transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body - 2 Column Layout */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-300px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Business & Representative Info */}
            <div className="space-y-6">
              {/* Business Details */}
              <div className="bg-gradient-to-br from-[#F8FFF9] to-white rounded-2xl p-6 border-2 border-[#B7E4C7]">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="bg-[#2F855A] p-2 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  Thông tin doanh nghiệp
                </h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-[#B7E4C7]">
                    <p className="text-xs text-gray-500 font-medium mb-1">Địa chỉ kinh doanh</p>
                    <p className="text-sm font-semibold text-gray-900">{supplier.businessAddress || 'Chưa cung cấp'}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-[#B7E4C7]">
                    <p className="text-xs text-gray-500 font-medium mb-1">Ngày đăng ký</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(supplier.createdAt).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Representative Info */}
              <div className="bg-gradient-to-br from-[#F8FFF9] to-white rounded-2xl p-6 border-2 border-[#B7E4C7]">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="bg-[#2F855A] p-2 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Người đại diện
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-[#B7E4C7]">
                    <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Họ và tên</p>
                      <p className="text-sm font-semibold text-gray-900">{supplier.fullName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-[#B7E4C7]">
                    <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-semibold text-gray-900">{supplier.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-xl p-4 border border-[#B7E4C7]">
                    <svg className="w-5 h-5 text-[#2F855A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Số điện thoại</p>
                      <p className="text-sm font-semibold text-gray-900">{supplier.phoneNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Documents */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#F8FFF9] to-white rounded-2xl p-6 border-2 border-[#B7E4C7]">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="bg-[#2F855A] p-2 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Giấy tờ đính kèm
                </h3>

                {(supplier.businessLicenseUrl || supplier.foodSafetyCertificateUrl) ? (
                  <div className="space-y-4">
                    {/* Business License */}
                    {supplier.businessLicenseUrl && (() => {
                      const fileUrl = getFileUrl(supplier.businessLicenseUrl);
                      const isPdf = isPdfFile(fileUrl);

                      return fileUrl ? (
                        <div className="bg-white rounded-xl p-5 border-2 border-[#B7E4C7] hover:border-[#A4C3A2] transition-all">
                          <div className="flex items-start gap-4 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-[#2F855A] flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-lg mb-1">Giấy phép kinh doanh</p>
                              {supplier.businessLicense && (
                                <p className="text-xs text-[#2F855A] bg-[#E8FFED] px-2 py-1 rounded mb-2 inline-block">
                                  Số: {supplier.businessLicense}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {isPdf ? '📄 File PDF' : '🖼️ File ảnh'}
                              </p>
                            </div>
                          </div>

                          {!isPdf ? (
                            <div className="space-y-2">
                              <img
                                src={fileUrl}
                                alt="Business License"
                                className="w-full rounded-lg border-2 border-[#B7E4C7] shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => window.open(fileUrl, '_blank')}
                                onError={(e) => {
                                  console.error('Image failed to load:', fileUrl);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 text-[#2F855A] hover:text-[#A4C3A2] font-semibold text-sm py-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Mở trong tab mới
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-[#2F855A] hover:bg-[#A4C3A2] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Xem file PDF
                              </a>
                              <p className="text-xs text-center text-gray-500">
                                Click vào nút trên để mở PDF trong tab mới
                              </p>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}

                    {/* Food Safety Certificate */}
                    {supplier.foodSafetyCertificateUrl && (() => {
                      const fileUrl = getFileUrl(supplier.foodSafetyCertificateUrl);
                      const isPdf = isPdfFile(fileUrl);

                      return fileUrl ? (
                        <div className="bg-white rounded-xl p-5 border-2 border-[#B7E4C7] hover:border-[#A4C3A2] transition-all">
                          <div className="flex items-start gap-4 mb-3">
                            <div className="w-12 h-12 rounded-xl bg-[#2F855A] flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-lg mb-1">Chứng nhận ATTP</p>
                              {supplier.foodSafetyCertificate && (
                                <p className="text-xs text-[#2F855A] bg-[#E8FFED] px-2 py-1 rounded mb-2 inline-block">
                                  Số: {supplier.foodSafetyCertificate}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {isPdf ? '📄 File PDF' : '🖼️ File ảnh'}
                              </p>
                            </div>
                          </div>

                          {!isPdf ? (
                            <div className="space-y-2">
                              <img
                                src={fileUrl}
                                alt="Food Safety Certificate"
                                className="w-full rounded-lg border-2 border-[#B7E4C7] shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => window.open(fileUrl, '_blank')}
                                onError={(e) => {
                                  console.error('Image failed to load:', fileUrl);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 text-[#2F855A] hover:text-[#A4C3A2] font-semibold text-sm py-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Mở trong tab mới
                              </a>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 bg-[#2F855A] hover:bg-[#A4C3A2] text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Xem file PDF
                              </a>
                              <p className="text-xs text-center text-gray-500">
                                Click vào nút trên để mở PDF trong tab mới
                              </p>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center border-2 border-dashed border-[#B7E4C7]">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 font-medium">Chưa có giấy tờ đính kèm</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-br from-[#F8FFF9] to-white border-t-2 border-[#B7E4C7] p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium transition-all"
          >
            Đóng
          </button>
          <button
            onClick={() => {
              onClose();
              onReject(supplier);
            }}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Từ chối
          </button>
          <button
            onClick={() => {
              onClose();
              onApprove(supplier);
            }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white rounded-xl hover:from-[#8FB491] hover:to-[#246B47] font-medium transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Duyệt ngay
          </button>
        </div>
      </div>
    </div>
  );
}
