import React from 'react';
import { Shield, Mail, Lock, ExternalLink } from 'lucide-react';

export default function PrivacyPolicy() {
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
            <div className="p-4 bg-gradient-to-br from-[#E8FFED] to-[#B7E4C7] rounded-xl">
              <Shield size={32} className="text-[#2F855A]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#2D2D2D]">
                Chính Sách Bảo Mật
              </h1>
              <p className="text-[#6B6B6B] mt-1">Privacy Policy</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8 text-[#2D2D2D]">
            {/* Introduction */}
            <section>
              <p className="text-lg leading-relaxed text-[#6B6B6B]">
                SaveFood cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn. 
                Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.
              </p>
            </section>

            {/* Data Collection */}
            <section className="bg-[#F8FFF9] rounded-xl p-6 border-l-4 border-[#2F855A]">
              <div className="flex items-start space-x-3 mb-4">
                <Mail size={24} className="text-[#2F855A] mt-1" />
                <div>
                  <h2 className="text-xl font-bold mb-2">Thông Tin Chúng Tôi Thu Thập</h2>
                  <p className="text-[#6B6B6B] leading-relaxed">
                    SaveFood thu thập các thông tin sau để cung cấp dịch vụ:
                  </p>
                </div>
              </div>
              <ul className="space-y-2 ml-9">
                <li className="flex items-start">
                  <span className="text-[#2F855A] mr-2">•</span>
                  <span className="text-[#6B6B6B]">
                    <strong className="text-[#2D2D2D]">Email</strong>: Để đăng nhập, xác thực tài khoản và liên hệ
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#2F855A] mr-2">•</span>
                  <span className="text-[#6B6B6B]">
                    <strong className="text-[#2D2D2D]">Thông tin profile</strong>: Tên, số điện thoại, địa chỉ cửa hàng
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#2F855A] mr-2">•</span>
                  <span className="text-[#6B6B6B]">
                    <strong className="text-[#2D2D2D]">Thông tin kinh doanh</strong>: Sản phẩm, đơn hàng, doanh thu
                  </span>
                </li>
              </ul>
            </section>

            {/* Data Usage */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <Lock size={24} className="text-[#2F855A] mr-2" />
                Cách Chúng Tôi Sử Dụng Dữ Liệu
              </h2>
              <div className="space-y-3 ml-8 text-[#6B6B6B]">
                <p className="flex items-start">
                  <span className="text-[#2F855A] mr-2">✓</span>
                  Xác thực và quản lý tài khoản đăng nhập
                </p>
                <p className="flex items-start">
                  <span className="text-[#2F855A] mr-2">✓</span>
                  Xử lý đơn hàng và thanh toán
                </p>
                <p className="flex items-start">
                  <span className="text-[#2F855A] mr-2">✓</span>
                  Cung cấp báo cáo doanh thu và phân tích
                </p>
                <p className="flex items-start">
                  <span className="text-[#2F855A] mr-2">✓</span>
                  Gửi thông báo quan trọng về đơn hàng và dịch vụ
                </p>
                <p className="flex items-start">
                  <span className="text-[#2F855A] mr-2">✓</span>
                  Cải thiện trải nghiệm người dùng
                </p>
              </div>
            </section>

            {/* Data Protection */}
            <section className="bg-[#F5EDE6] rounded-xl p-6 border-l-4 border-[#A4C3A2]">
              <h2 className="text-xl font-bold mb-4">Bảo Vệ Dữ Liệu</h2>
              <div className="space-y-3 text-[#6B6B6B]">
                <p className="leading-relaxed">
                  <strong className="text-[#2D2D2D]">Lưu trữ an toàn:</strong> Dữ liệu được mã hóa và lưu trữ trên hệ thống bảo mật.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-[#2D2D2D]">Không chia sẻ bên thứ 3:</strong> Chúng tôi không bán hoặc chia sẻ thông tin cá nhân của bạn cho bên thứ ba vì mục đích tiếp thị.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-[#2D2D2D]">Xác thực qua Keycloak:</strong> Hệ thống đăng nhập được bảo vệ bởi Keycloak Identity Management.
                </p>
              </div>
            </section>

            {/* Third Party Services */}
            <section>
              <h2 className="text-xl font-bold mb-4">Dịch Vụ Bên Thứ Ba</h2>
              <p className="text-[#6B6B6B] leading-relaxed mb-3">
                SaveFood có thể sử dụng các dịch vụ bên thứ ba để vận hành nền tảng:
              </p>
              <ul className="space-y-2 ml-6 text-[#6B6B6B]">
                <li className="flex items-start">
                  <span className="text-[#A4C3A2] mr-2">◆</span>
                  Keycloak (Xác thực và quản lý tài khoản)
                </li>
                <li className="flex items-start">
                  <span className="text-[#A4C3A2] mr-2">◆</span>
                  Cloudinary (Lưu trữ hình ảnh sản phẩm)
                </li>
                <li className="flex items-start">
                  <span className="text-[#A4C3A2] mr-2">◆</span>
                  VNPAY, MoMo (Thanh toán trực tuyến)
                </li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="bg-[#E8FFED] rounded-xl p-6 border-l-4 border-[#2F855A]">
              <h2 className="text-xl font-bold mb-4">Quyền Của Bạn</h2>
              <div className="space-y-2 text-[#6B6B6B]">
                <p>✓ Truy cập và chỉnh sửa thông tin cá nhân</p>
                <p>✓ Yêu cầu xóa tài khoản và dữ liệu</p>
                <p>✓ Xuất dữ liệu cá nhân</p>
                <p>✓ Từ chối nhận email marketing (không áp dụng cho email giao dịch)</p>
              </div>
            </section>

            {/* Contact & Links */}
            <section className="border-t border-[#E8FFED] pt-6">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-bold mb-4">Liên Hệ & Thông Tin Thêm</h2>
                <p className="text-[#6B6B6B] leading-relaxed">
                  Nếu bạn có câu hỏi về chính sách bảo mật hoặc muốn thực hiện quyền của mình, 
                  vui lòng liên hệ:
                </p>
                <div className="flex items-center justify-center space-x-2 text-[#2F855A]">
                  <Mail size={20} />
                  <a 
                    href="mailto:support@savefood.com" 
                    className="font-medium hover:underline"
                  >
                    support@savefood.com
                  </a>
                </div>
                <div className="flex justify-center gap-6 pt-4">
                  <a
                    href="/delete-data"
                    className="inline-flex items-center space-x-2 text-[#2F855A] hover:text-[#2D2D2D] font-medium transition-colors group"
                  >
                    <span>Hướng dẫn xóa dữ liệu</span>
                    <ExternalLink size={18} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
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
