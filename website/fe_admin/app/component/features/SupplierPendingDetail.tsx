import React from 'react';
import type { Supplier } from '~/service/supplierService';
import { getDownloadableCloudinaryUrl } from '~/utils/fileUtils';

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

  // Get document file URL with download flag
  const getFileUrl = (fileUrl: string | null | undefined): string | null => {
    if (!fileUrl) return null;
    try {
      let processedUrl: string;
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        // Nếu là PDF Cloudinary nhưng sai resource type, sửa lại cho đúng
        if (fileUrl.includes('res.cloudinary.com')) {
          if (isPdfFile(fileUrl) && fileUrl.includes('/image/upload/')) {
            processedUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
          } else {
            processedUrl = fileUrl;
          }
        } else {
          processedUrl = fileUrl;
        }
      } else {
        const cloudName = 'dk7coitah';
        let publicId = fileUrl.replace(/^cloudinary:\/\//, '');
        const isPdf = publicId.toLowerCase().includes('.pdf') || publicId.toLowerCase().includes('pdf');
        const resourceType = isPdf ? 'raw' : 'image';
        const cleanPublicId = publicId.replace(/\.(jpg|jpeg|png|gif|pdf|webp)$/i, '');
        processedUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cleanPublicId}`;
      }
      return getDownloadableCloudinaryUrl(processedUrl);
    } catch (error) {
      console.error('Error processing file URL:', error, 'Original URL:', fileUrl);
      return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
      <div className="relative bg-surface rounded-2xl shadow-lg w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-surface-light px-8 py-6 border-b border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl bg-surface shadow-sm overflow-hidden border-4 border-surface ring-2 ring-primary-light">
                  <img
                    src={supplier.avatarUrl || 'https://via.placeholder.com/96'}
                    alt={supplier.businessName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-accent-warm text-surface px-3 py-1 rounded-full text-xs font-bold shadow-md">
                  ĐANG CHỜ
                </div>
              </div>
              <div>
                <h1 className="heading-secondary mb-2">{supplier.businessName}</h1>
                <div className="flex items-center gap-4">
                  <span className="badge-neutral border border-default">
                    {supplier.businessType || 'Doanh nghiệp'}
                  </span>
                  <div className="h-4 w-px bg-text-light/30"></div>
                  <span className="font-mono text-sm text-text-muted bg-surface-light px-3 py-2 rounded-lg border border-default">
                    MST: {supplier.taxCode}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-surface-light rounded-xl transition-all duration-200 group"
            >
              <svg className="w-6 h-6 text-text-light group-hover:text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body - Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left Column - Business & Representative Info */}
              <div className="space-y-8">
                {/* Business Details */}
                <div className="card card-hover p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6 text-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h2 className="heading-secondary">Thông tin doanh nghiệp</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-surface-light rounded-xl p-4 border-l-4 border-primary">
                      <p className="text-xs text-text-muted font-medium mb-2 uppercase tracking-wide">Địa chỉ kinh doanh</p>
                      <p className="text-sm font-semibold text-text leading-relaxed">
                        {supplier.businessAddress || 'Chưa cung cấp'}
                      </p>
                    </div>
                    <div className="bg-surface-light rounded-xl p-4 border-l-4 border-primary">
                      <p className="text-xs text-text-muted font-medium mb-2 uppercase tracking-wide">Ngày đăng ký</p>
                      <p className="text-sm font-semibold text-text">
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
                <div className="card card-hover p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6 text-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="heading-secondary">Người đại diện</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-surface-light rounded-xl p-4 border-l-4 border-primary">
                      <div className="w-10 h-10 bg-primary-lighter rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Họ và tên</p>
                        <p className="text-sm font-semibold text-text truncate">{supplier.fullName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-surface-light rounded-xl p-4 border-l-4 border-primary">
                      <div className="w-10 h-10 bg-primary-lighter rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Email</p>
                        <p className="text-sm font-semibold text-text truncate">{supplier.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-surface-light rounded-xl p-4 border-l-4 border-primary">
                      <div className="w-10 h-10 bg-primary-lighter rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Số điện thoại</p>
                        <p className="text-sm font-semibold text-text">{supplier.phoneNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Documents */}
              <div className="space-y-8">
                <div className="card card-hover p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-6 h-6 text-surface" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="heading-secondary">Giấy tờ đính kèm</h2>
                  </div>

                  {(supplier.businessLicenseUrl || supplier.foodSafetyCertificateUrl) ? (
                    <div className="space-y-6">
                      {/* Business License */}
                      {supplier.businessLicenseUrl && (() => {
                        const fileUrl = getFileUrl(supplier.businessLicenseUrl);
                        const isPdf = isPdfFile(fileUrl);

                        return fileUrl ? (
                          <div className="bg-surface-light rounded-xl p-5 border-2 border-default card-hover group">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-14 h-14 bg-surface rounded-xl shadow-sm border border-default flex items-center justify-center flex-shrink-0 group-hover:shadow-md transition-shadow">
                                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-text text-lg mb-2">Giấy phép kinh doanh</h3>
                                {supplier.businessLicense && (
                                  <p className="text-xs text-secondary bg-primary-lighter px-3 py-1.5 rounded-lg font-medium mb-2 inline-block">
                                    Số: {supplier.businessLicense}
                                  </p>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${isPdf ? 'bg-blue-50 text-blue-600' : 'badge-success'}`}>
                                    {isPdf ? '📄 PDF Document' : '🖼️ Image File'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {!isPdf ? (
                              <div className="space-y-3">
                                <div className="relative rounded-lg overflow-hidden border-2 border-default shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                  <img
                                    src={fileUrl}
                                    alt="Business License"
                                    className="w-full h-48 object-contain bg-surface"
                                    onClick={() => window.open(fileUrl, '_blank')}
                                    onError={(e) => {
                                      console.error('Image failed to load:', fileUrl);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 text-primary hover:text-primary-dark font-medium text-sm py-2 bg-primary-lighter rounded-lg hover:bg-primary-light transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Mở trong tab mới
                                </a>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-3 btn-primary py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Xem file PDF
                                </a>
                                <p className="text-xs text-center text-text-light">
                                  File PDF sẽ mở trong tab mới
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
                          <div className="bg-surface-light rounded-xl p-5 border-2 border-default card-hover group">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-14 h-14 bg-surface rounded-xl shadow-sm border border-default flex items-center justify-center flex-shrink-0 group-hover:shadow-md transition-shadow">
                                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-text text-lg mb-2">Chứng nhận ATTP</h3>
                                {supplier.foodSafetyCertificate && (
                                  <p className="text-xs text-secondary bg-primary-lighter px-3 py-1.5 rounded-lg font-medium mb-2 inline-block">
                                    Số: {supplier.foodSafetyCertificate}
                                  </p>
                                )}
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${isPdf ? 'bg-blue-50 text-blue-600' : 'badge-success'}`}>
                                    {isPdf ? '📄 PDF Document' : '🖼️ Image File'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {!isPdf ? (
                              <div className="space-y-3">
                                <div className="relative rounded-lg overflow-hidden border-2 border-default shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                  <img
                                    src={fileUrl}
                                    alt="Food Safety Certificate"
                                    className="w-full h-48 object-contain bg-surface"
                                    onClick={() => window.open(fileUrl, '_blank')}
                                    onError={(e) => {
                                      console.error('Image failed to load:', fileUrl);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 text-primary hover:text-primary-dark font-medium text-sm py-2 bg-primary-lighter rounded-lg hover:bg-primary-light transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  Mở trong tab mới
                                </a>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-3 btn-primary py-3 px-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Xem file PDF
                                </a>
                                <p className="text-xs text-center text-text-light">
                                  File PDF sẽ mở trong tab mới
                                </p>
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    <div className="bg-surface-light rounded-xl p-12 text-center border-2 border-dashed border-default">
                      <svg className="w-16 h-16 text-text-light mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-text-muted font-medium text-lg mb-2">Chưa có giấy tờ đính kèm</p>
                      <p className="text-text-light text-sm">Nhà cung cấp chưa tải lên tài liệu nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-surface-light border-t border-default px-8 py-6">
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-8 py-4 bg-surface border-2 border-default text-text rounded-xl hover:bg-surface-light hover:border-primary font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                onClose();
                onReject(supplier);
              }}
              className="flex-1 px-8 py-4 bg-accent-red text-surface rounded-xl hover:bg-red-700 font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3"
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
              className="flex-1 px-8 py-4 btn-primary rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Duyệt ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}