import React from 'react'

const Policy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FFF9] to-[#E8F5E9] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2D3748] mb-4">
            Chính sách bảo mật dành cho nhà cung cấp
          </h1>
          <div className="w-20 h-1 bg-[#A8D5BA] mx-auto rounded-full"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* Section 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2D7D46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#2D3748]">Mục đích thu thập thông tin</h2>
            </div>
            <p className="text-[#4A5568] leading-relaxed">
              Đối với nhà cung cấp, SaveFood tiến hành thu thập thông tin nhằm xác minh tư cách pháp lý, đảm bảo tính chính xác của dữ liệu kinh doanh và hỗ trợ hiệu quả cho hoạt động quản lý gian hàng. Thông tin này giúp SaveFood quản lý việc đăng tải sản phẩm, xử lý đơn hàng, đối soát thanh toán và thống kê doanh thu. Ngoài ra, dữ liệu của nhà cung cấp còn được sử dụng để đảm bảo minh bạch trong giao dịch và tuân thủ quy định của pháp luật về hoạt động thương mại điện tử.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2D7D46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#2D3748]">Loại thông tin được thu thập</h2>
            </div>
            <p className="text-[#4A5568] leading-relaxed">
              Thông tin mà SaveFood thu thập từ nhà cung cấp bao gồm: tên doanh nghiệp hoặc cửa hàng, mã số thuế, giấy phép kinh doanh, họ tên và thông tin liên hệ của người đại diện, tài khoản ngân hàng, cũng như dữ liệu liên quan đến sản phẩm, giá bán, hình ảnh và lịch sử giao dịch. Những thông tin này phục vụ trực tiếp cho hoạt động vận hành của nền tảng và quá trình hợp tác giữa hai bên.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2D7D46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#2D3748]">Phạm vi sử dụng thông tin</h2>
            </div>
            <p className="text-[#4A5568] leading-relaxed">
              SaveFood chỉ sử dụng thông tin của nhà cung cấp trong phạm vi cần thiết để đảm bảo hoạt động kinh doanh hiệu quả. Dữ liệu được dùng để hiển thị sản phẩm, xử lý giao dịch, đối soát và thanh toán doanh thu, cũng như gửi thông báo, báo cáo hoặc thay đổi về chính sách hợp tác. Trong trường hợp phát sinh tranh chấp hoặc khiếu nại, Save Food có thể sử dụng thông tin này để hỗ trợ pháp lý hoặc phối hợp với cơ quan chức năng theo quy định.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2D7D46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#2D3748]">Bảo mật và chia sẻ thông tin</h2>
            </div>
            <p className="text-[#4A5568] leading-relaxed">
              Save Food cam kết không tiết lộ thông tin của nhà cung cấp cho bất kỳ bên thứ ba nào khi chưa có sự đồng ý rõ ràng, trừ trường hợp bắt buộc theo yêu cầu của cơ quan nhà nước có thẩm quyền. Tất cả dữ liệu của nhà cung cấp được lưu trữ an toàn trên hệ thống máy chủ đạt chuẩn bảo mật quốc tế, đồng thời các thông tin nhạy cảm như tài khoản ngân hàng đều được mã hóa bằng công nghệ SSL nhằm ngăn chặn việc truy cập trái phép.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2D7D46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#2D3748]">Quyền của nhà cung cấp</h2>
            </div>
            <p className="text-[#4A5568] leading-relaxed">
              Nhà cung cấp có quyền truy cập, chỉnh sửa, cập nhật hoặc yêu cầu xóa thông tin doanh nghiệp của mình trên hệ thống Save Food. Sau khi chấm dứt hợp tác, nhà cung cấp có thể đề nghị Save Food xóa toàn bộ dữ liệu liên quan, bao gồm thông tin giao dịch và tài khoản thanh toán. Save Food tôn trọng quyền sở hữu thông tin của đối tác và chỉ lưu trữ dữ liệu trong thời gian cần thiết để thực hiện nghĩa vụ pháp lý và tài chính.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#E8F5E9] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2D7D46]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#2D3748]">Cam kết bảo mật và an toàn dữ liệu</h2>
            </div>
            <p className="text-[#4A5568] leading-relaxed">
              Save Food cam kết không mua bán, trao đổi hoặc tiết lộ thông tin cá nhân của người dùng dưới bất kỳ hình thức nào. Tất cả dữ liệu được bảo vệ bằng hệ thống tường lửa, mã hóa và các biện pháp kiểm soát truy cập nghiêm ngặt. Trong trường hợp xảy ra sự cố an ninh mạng hoặc mất mát dữ liệu, Save Food sẽ chủ động thông báo cho người dùng và cơ quan chức năng có liên quan, đồng thời triển khai các biện pháp khắc phục để hạn chế tối đa thiệt hại.
            </p>
          </section>

          {/* Conclusion */}
          <div className="bg-[#F8FFF9] border border-[#E8F5E9] rounded-xl p-6 mt-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 bg-[#2D7D46] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#2D3748]">Cam kết của chúng tôi</h3>
            </div>
            <p className="text-[#4A5568] leading-relaxed">
              Chúng tôi luôn đặt sự an toàn và quyền riêng tư của người dùng lên hàng đầu, coi đó là nền tảng để xây dựng niềm tin và phát triển bền vững của hệ thống Save Food.
            </p>
          </div>

          {/* Last Updated */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-[#718096]">
              Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Policy