import React from 'react';
import { Trash2, Mail, ExternalLink, AlertCircle, Shield, FileText } from 'lucide-react';

export default function DeleteData() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EDE6] via-[#FFFEFA] to-[#E8FFED]">
      {/* Simple Header */}
      <nav className="bg-white shadow-sm border-b border-[#E8FFED]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">SF</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#2F855A] to-[#A4C3A2] bg-clip-text text-transparent">
              SaveFood
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-[#E8FFED]">
          {/* Header Section */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-[#FFE8E8] to-[#FFD6D6] rounded-xl">
              <Trash2 size={32} className="text-[#DC2626]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#2D2D2D]">
                Yêu Cầu Xóa Dữ Liệu
              </h1>
              <p className="text-[#6B6B6B] mt-1">Data Deletion Request</p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-[#FFF3CD] border-l-4 border-[#FFC107] rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <AlertCircle size={24} className="text-[#FFC107] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-[#2D2D2D] mb-2">Lưu Ý Quan Trọng</h3>
                <p className="text-[#6B6B6B] leading-relaxed">
                  Việc xóa dữ liệu sẽ xóa vĩnh viễn tài khoản và tất cả thông tin liên quan của bạn. 
                  Hành động này <strong>không thể hoàn tác</strong>. Vui lòng cân nhắc kỹ trước khi thực hiện.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8 text-[#2D2D2D]">
            {/* What will be deleted */}
            <section className="bg-[#F8FFF9] rounded-xl p-6 border-l-4 border-[#DC2626]">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Trash2 size={24} className="text-[#DC2626] mr-2" />
                Dữ Liệu Sẽ Bị Xóa
              </h2>
              <ul className="space-y-2 ml-8 text-[#6B6B6B]">
                <li className="flex items-start">
                  <span className="text-[#DC2626] mr-2">✗</span>
                  Thông tin tài khoản (email, mật khẩu, profile)
                </li>
                <li className="flex items-start">
                  <span className="text-[#DC2626] mr-2">✗</span>
                  Thông tin cửa hàng và sản phẩm
                </li>
                <li className="flex items-start">
                  <span className="text-[#DC2626] mr-2">✗</span>
                  Lịch sử đơn hàng và giao dịch
                </li>
                <li className="flex items-start">
                  <span className="text-[#DC2626] mr-2">✗</span>
                  Hình ảnh và tài liệu đã tải lên
                </li>
                <li className="flex items-start">
                  <span className="text-[#DC2626] mr-2">✗</span>
                  Tin nhắn và đánh giá
                </li>
              </ul>
            </section>

            {/* Methods */}
            <section>
              <h2 className="text-2xl font-bold mb-6">Cách Yêu Cầu Xóa Dữ Liệu</h2>
              
              {/* Method 1: Email */}
              <div className="bg-gradient-to-r from-[#E8FFED] to-[#F8FFF9] rounded-xl p-6 mb-6 border border-[#B7E4C7]">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                    <Mail size={28} className="text-[#2F855A]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">Phương Án 1: Liên Hệ Qua Email</h3>
                    <p className="text-[#6B6B6B] mb-4 leading-relaxed">
                      Gửi yêu cầu xóa dữ liệu đến email hỗ trợ của chúng tôi:
                    </p>
                    <a
                      href="mailto:support@savefood.com?subject=Yêu cầu xóa dữ liệu tài khoản&body=Xin chào SaveFood,%0D%0A%0D%0ATôi muốn yêu cầu xóa toàn bộ dữ liệu và tài khoản của tôi.%0D%0A%0D%0AEmail đăng ký: [Nhập email của bạn]%0D%0ALý do xóa: [Tùy chọn]%0D%0A%0D%0ATrân trọng."
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#A4C3A2] to-[#2F855A] text-white rounded-lg hover:from-[#8FB491] hover:to-[#2F855A] font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <Mail size={20} />
                      <span>Gửi Email: support@savefood.com</span>
                    </a>
                    <div className="mt-4 text-sm text-[#6B6B6B] bg-white rounded-lg p-4">
                      <p className="font-semibold text-[#2D2D2D] mb-2">Thông tin cần cung cấp:</p>
                      <ul className="space-y-1 ml-4">
                        <li>• Email đăng ký tài khoản</li>
                        <li>• Họ tên và số điện thoại (để xác thực)</li>
                        <li>• Lý do xóa tài khoản (tùy chọn)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Method 2: Keycloak */}
              <div className="bg-gradient-to-r from-[#F5EDE6] to-[#FFFEFA] rounded-xl p-6 border border-[#DDC6B6]">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                    <Shield size={28} className="text-[#A4C3A2]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">Phương Án 2: Keycloak Account Management</h3>
                    <p className="text-[#6B6B6B] mb-4 leading-relaxed">
                      Truy cập vào trang quản lý tài khoản Keycloak để thu hồi quyền truy cập ứng dụng:
                    </p>
                    <ol className="space-y-3 text-[#6B6B6B] mb-4">
                      <li className="flex items-start">
                        <span className="font-bold text-[#2F855A] mr-2 flex-shrink-0">1.</span>
                        <span>Truy cập Keycloak Account Console</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold text-[#2F855A] mr-2 flex-shrink-0">2.</span>
                        <span>Đăng nhập bằng tài khoản SaveFood của bạn</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold text-[#2F855A] mr-2 flex-shrink-0">3.</span>
                        <span>Vào mục <strong className="text-[#2D2D2D]">"Applications"</strong></span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold text-[#2F855A] mr-2 flex-shrink-0">4.</span>
                        <span>Tìm ứng dụng <strong className="text-[#2D2D2D]">"SaveFood"</strong> và nhấn <strong className="text-[#2D2D2D]">"Revoke Access"</strong></span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold text-[#2F855A] mr-2 flex-shrink-0">5.</span>
                        <span>Sau đó gửi email đến support@savefood.com để yêu cầu xóa hoàn toàn dữ liệu</span>
                      </li>
                    </ol>
                    <a
                      href={`${import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080'}/realms/${import.meta.env.VITE_KEYCLOAK_REALM || 'savefood'}/account/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-white border-2 border-[#A4C3A2] text-[#2D2D2D] rounded-lg hover:bg-[#F8FFF9] font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <ExternalLink size={20} />
                      <span>Mở Keycloak Account</span>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Processing Time */}
            <section className="bg-[#E8FFED] rounded-xl p-6 border-l-4 border-[#2F855A]">
              <h2 className="text-xl font-bold mb-4">Thời Gian Xử Lý</h2>
              <div className="space-y-3 text-[#6B6B6B]">
                <p className="flex items-start">
                  <span className="text-[#2F855A] mr-2 flex-shrink-0">•</span>
                  <span>Yêu cầu sẽ được xử lý trong vòng <strong className="text-[#2D2D2D]">7-14 ngày làm việc</strong></span>
                </p>
                <p className="flex items-start">
                  <span className="text-[#2F855A] mr-2 flex-shrink-0">•</span>
                  <span>Bạn sẽ nhận email xác nhận khi quá trình hoàn tất</span>
                </p>
                <p className="flex items-start">
                  <span className="text-[#2F855A] mr-2 flex-shrink-0">•</span>
                  <span>Một số dữ liệu có thể được giữ lại theo yêu cầu pháp lý (hóa đơn, giao dịch tài chính)</span>
                </p>
              </div>
            </section>

            {/* Footer Links */}
            <section className="border-t border-[#E8FFED] pt-6">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="font-bold text-[#2D2D2D] mb-2">Cần Hỗ Trợ?</h3>
                  <div className="flex items-center justify-center space-x-2 text-[#2F855A]">
                    <Mail size={18} />
                    <a 
                      href="mailto:support@savefood.com" 
                      className="font-medium hover:underline"
                    >
                      support@savefood.com
                    </a>
                  </div>
                </div>
                <a
                  href="/privacy-policy"
                  className="inline-flex items-center space-x-2 text-[#2F855A] hover:text-[#2D2D2D] font-medium transition-colors group"
                >
                  <FileText size={18} />
                  <span>Xem Chính Sách Bảo Mật</span>
                  <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </section>

            {/* Last Updated */}
            <div className="text-sm text-[#6B6B6B] text-center pt-6 border-t border-[#E8FFED]">
              Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
