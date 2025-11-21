import React from 'react'

const Clause = () => {
  return (
    <div className="min-h-screen bg-surface-light py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="heading-primary text-[#2F855A]">ĐIỀU KHOẢN SỬ DỤNG</h1>
          <p className="text-muted mt-2">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <div className="card p-8 space-y-8">
          {/* Section 1 */}
          <section className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="badge-success mt-1 flex-shrink-0">1</div>
              <div>
                <h2 className="heading-secondary">Quy định chung</h2>
                <div className="space-y-4 text-[#2D2D2D] leading-relaxed">
                  <p>
                    Điều khoản sử dụng này quy định mối quan hệ pháp lý giữa nền tảng SaveFood với hai nhóm đối tượng chính là Khách hàng (người tiêu dùng) và Nhà cung cấp (đơn vị hoặc cá nhân kinh doanh thực phẩm) khi tham gia các hoạt động trên hệ thống. Việc người dùng đăng ký tài khoản, truy cập website hoặc ứng dụng di động của Save Food đồng nghĩa với việc đã đọc, hiểu, chấp thuận và đồng ý bị ràng buộc bởi toàn bộ các điều khoản được nêu tại văn bản này.
                  </p>
                  <p>
                    SaveFood có quyền điều chỉnh, bổ sung hoặc cập nhật các điều khoản sử dụng theo từng giai đoạn vận hành nhằm phù hợp với quy định pháp luật và chính sách phát triển của hệ thống. Mọi thay đổi sẽ được công bố công khai trên website chính thức của Save Food và có hiệu lực ngay sau khi được đăng tải. Người dùng có trách nhiệm thường xuyên theo dõi để nắm bắt nội dung cập nhật mới nhất.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="badge-success mt-1 flex-shrink-0">2</div>
              <div className="flex-1">
                <h2 className="heading-secondary">Điều khoản dành cho khách hàng</h2>
                
                <div className="space-y-6 ml-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[#2F855A] flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#A4C3A2] rounded-full"></span>
                      2.1. Nghĩa vụ và trách nhiệm của khách hàng
                    </h3>
                    <div className="space-y-3 text-[#2D2D2D] leading-relaxed">
                      <p>
                        Khách hàng có nghĩa vụ cung cấp thông tin đầy đủ, trung thực và chính xác trong quá trình đăng ký tài khoản và sử dụng dịch vụ. Các thông tin bao gồm họ tên, số điện thoại, địa chỉ giao hàng, phương thức thanh toán và các dữ liệu liên quan đến việc xác thực danh tính. SaveFood không chịu trách nhiệm đối với các sự cố phát sinh do khách hàng cung cấp thông tin sai lệch hoặc không cập nhật kịp thời.
                      </p>
                      <p>
                        Khách hàng cam kết chỉ sử dụng nền tảng SaveFood cho mục đích tiêu dùng cá nhân và hợp pháp. Mọi hành vi lợi dụng hệ thống để trục lợi, lừa đảo, lan truyền thông tin sai lệch, can thiệp kỹ thuật hoặc gây tổn hại đến hệ thống sẽ bị xử lý theo quy định pháp luật và bị tạm dừng quyền truy cập vĩnh viễn.
                      </p>
                      <p>
                        Khách hàng đồng thời có nghĩa vụ tuân thủ quy định về thanh toán, nhận hàng, đổi trả và phản hồi sản phẩm theo đúng chính sách đã công bố. Trong trường hợp xảy ra tranh chấp, khách hàng có quyền gửi khiếu nại trực tiếp đến SaveFood để được xem xét, hỗ trợ và bảo vệ quyền lợi hợp pháp của mình.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[#2F855A] flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#A4C3A2] rounded-full"></span>
                      2.2. Quyền của khách hàng
                    </h3>
                    <div className="space-y-3 text-[#2D2D2D] leading-relaxed">
                      <p>
                        Khách hàng được quyền truy cập, sử dụng và hưởng lợi từ các dịch vụ mà Save Food cung cấp, bao gồm tìm kiếm sản phẩm, đặt hàng, nhận khuyến mãi và tham gia các chương trình ưu đãi. Khách hàng có quyền được bảo mật thông tin cá nhân, được thông báo rõ ràng về giá, chất lượng và nguồn gốc sản phẩm trước khi giao dịch.
                      </p>
                      <p>
                        Ngoài ra, khách hàng có quyền yêu cầu SaveFood hỗ trợ giải quyết các sự cố phát sinh liên quan đến đơn hàng, hoàn tiền, chất lượng sản phẩm hoặc thái độ phục vụ của nhà cung cấp. SaveFood cam kết xử lý các yêu cầu này trên nguyên tắc minh bạch, nhanh chóng và công bằng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="badge-success mt-1 flex-shrink-0">3</div>
              <div className="flex-1">
                <h2 className="heading-secondary">Điều khoản dành cho nhà cung cấp</h2>
                
                <div className="space-y-6 ml-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[#2F855A] flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#A4C3A2] rounded-full"></span>
                      3.1. Trách nhiệm và nghĩa vụ của nhà cung cấp
                    </h3>
                    <div className="space-y-3 text-[#2D2D2D] leading-relaxed">
                      <p>
                        Nhà cung cấp khi đăng ký tham gia SaveFood cần đảm bảo rằng các thông tin về pháp lý, kinh doanh và sản phẩm được cung cấp là chính xác, đầy đủ và hợp pháp. Điều này bao gồm nhưng không giới hạn ở tên doanh nghiệp/cá nhân, mã số thuế, địa chỉ kinh doanh, tài khoản thanh toán, và các giấy phép liên quan đến an toàn thực phẩm.
                      </p>
                      <p>
                        Nhà cung cấp chịu trách nhiệm tuyệt đối đối với tính xác thực và chất lượng của hàng hóa. Mọi sản phẩm được đăng tải trên hệ thống SaveFood phải đảm bảo còn hạn sử dụng, có nhãn mác rõ ràng và đáp ứng các tiêu chuẩn vệ sinh, an toàn thực phẩm theo quy định của pháp luật Việt Nam. Việc cung cấp sản phẩm giả mạo, kém chất lượng hoặc không rõ nguồn gốc sẽ bị xử lý nghiêm khắc và có thể dẫn đến việc tạm ngừng hoặc chấm dứt tài khoản vĩnh viễn.
                      </p>
                      <p>
                        Nhà cung cấp có nghĩa vụ tiếp nhận và xử lý khiếu nại của khách hàng liên quan đến sản phẩm do mình cung cấp. Trong trường hợp xảy ra tranh chấp, SaveFood sẽ đứng ra trung gian hỗ trợ các bên thương lượng nhằm đảm bảo quyền lợi hợp pháp và uy tín của nền tảng.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[#2F855A] flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#A4C3A2] rounded-full"></span>
                      3.2. Quyền của nhà cung cấp
                    </h3>
                    <div className="space-y-3 text-[#2D2D2D] leading-relaxed">
                      <p>
                        Nhà cung cấp được quyền sử dụng nền tảng SaveFood để đăng tải, quảng bá, quản lý và kinh doanh sản phẩm hợp pháp của mình. SaveFood cung cấp cho nhà cung cấp các công cụ hỗ trợ quản lý đơn hàng, theo dõi doanh thu và thống kê dữ liệu giao dịch nhằm nâng cao hiệu quả kinh doanh.
                      </p>
                      <p>
                        Nhà cung cấp có quyền yêu cầu SaveFood bảo vệ thông tin kinh doanh, không tiết lộ dữ liệu doanh thu hoặc danh sách khách hàng cho bên thứ ba nếu không có sự đồng ý bằng văn bản. Đồng thời, nhà cung cấp được quyền tham gia các chương trình khuyến mãi, quảng bá hoặc chiến dịch marketing của SaveFood nhằm mở rộng phạm vi tiếp cận khách hàng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="badge-success mt-1 flex-shrink-0">4</div>
              <div>
                <h2 className="heading-secondary">Quyền và trách nhiệm của SaveFood</h2>
                <div className="space-y-4 text-[#2D2D2D] leading-relaxed">
                  <p>
                    SaveFood đóng vai trò là nền tảng trung gian kết nối giữa khách hàng và nhà cung cấp. Hệ thống chịu trách nhiệm xây dựng, duy trì và đảm bảo môi trường giao dịch minh bạch, an toàn, ổn định. SaveFood không trực tiếp tham gia vào quá trình sản xuất, lưu trữ hoặc vận chuyển sản phẩm; do đó, nền tảng không chịu trách nhiệm pháp lý đối với chất lượng sản phẩm nếu lỗi phát sinh từ phía nhà cung cấp.
                  </p>
                  <p>
                    SaveFood có quyền tạm ngừng hoặc chấm dứt hoạt động của tài khoản người dùng trong các trường hợp vi phạm quy định sử dụng, có hành vi gian lận hoặc gây ảnh hưởng tiêu cực đến cộng đồng người dùng. Đồng thời, SaveFood có quyền thu thập, phân tích dữ liệu hành vi của người dùng để nâng cao chất lượng dịch vụ, với điều kiện đảm bảo tuân thủ chính sách bảo mật thông tin cá nhân.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-6 border-t border-default">
            <p className="text-center text-light text-sm">
              Bằng việc sử dụng dịch vụ SaveFood, bạn đã đồng ý với tất cả các điều khoản trên.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Clause