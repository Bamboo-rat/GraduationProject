export default function DashboardOverview() {
  const stats = [
    { 
      title: 'Doanh thu hôm nay', 
      value: '0 ₫', 
      icon: '💰',
      color: 'from-[#A4C3A2] to-[#2F855A]',
      change: '+12.5%',
      trend: 'up'
    },
    { 
      title: 'Đơn hàng mới', 
      value: '0', 
      icon: '📦',
      color: 'from-[#8FB491] to-[#A4C3A2]',
      change: '+8.2%',
      trend: 'up'
    },
    { 
      title: 'Sản phẩm bán chạy', 
      value: '0', 
      icon: '🔥',
      color: 'from-[#FF6B35] to-[#E63946]',
      change: '+15.3%',
      trend: 'up'
    },
    { 
      title: 'Tổng hoa hồng', 
      value: '0 ₫', 
      icon: '💎',
      color: 'from-[#B7E4C7] to-[#A4C3A2]',
      change: '+5.1%',
      trend: 'up'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Tổng quan Dashboard</h1>
          <p className="text-[#6B6B6B] mt-1">Chào mừng trở lại! Đây là tình hình hoạt động của bạn</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-4 py-2 border border-[#B7E4C7] rounded-xl bg-white text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#A4C3A2]">
            <option>Hôm nay</option>
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
            <option>Tháng này</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-sm`}>
                {stat.icon}
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                stat.trend === 'up' ? 'bg-[#E8FFED] text-[#2F855A]' : 'bg-red-50 text-[#E63946]'
              }`}>
                {stat.change}
              </div>
            </div>
            <h3 className="text-[#6B6B6B] text-sm font-medium mb-2">{stat.title}</h3>
            <p className="text-2xl font-bold text-[#2D2D2D]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#E8FFED] to-[#D9FFDF] rounded-2xl p-6 border border-[#B7E4C7]">
        <h2 className="text-lg font-semibold text-[#2D2D2D] mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="bg-white hover:bg-[#F8FFF9] rounded-xl p-4 flex flex-col items-center space-y-2 transition-all border border-[#B7E4C7]">
            <span className="text-2xl">➕</span>
            <span className="text-sm font-medium text-[#2D2D2D]">Thêm sản phẩm</span>
          </button>
          <button className="bg-white hover:bg-[#F8FFF9] rounded-xl p-4 flex flex-col items-center space-y-2 transition-all border border-[#B7E4C7]">
            <span className="text-2xl">📊</span>
            <span className="text-sm font-medium text-[#2D2D2D]">Xem báo cáo</span>
          </button>
          <button className="bg-white hover:bg-[#F8FFF9] rounded-xl p-4 flex flex-col items-center space-y-2 transition-all border border-[#B7E4C7]">
            <span className="text-2xl">🎁</span>
            <span className="text-sm font-medium text-[#2D2D2D]">Khuyến mãi</span>
          </button>
          <button className="bg-white hover:bg-[#F8FFF9] rounded-xl p-4 flex flex-col items-center space-y-2 transition-all border border-[#B7E4C7]">
            <span className="text-2xl">⚙️</span>
            <span className="text-sm font-medium text-[#2D2D2D]">Cài đặt</span>
          </button>
        </div>
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-[#2D2D2D]">Hoạt động gần đây</h2>
            <button className="text-sm text-[#2F855A] hover:text-[#8FB491] font-medium">Xem tất cả</button>
          </div>
          <div className="space-y-4">
            {[1,2,3,4].map((item) => (
              <div key={item} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-[#F8FFF9] transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#E8FFED] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🛒</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#2D2D2D]">Đơn hàng mới #00{item}</p>
                  <p className="text-xs text-[#8B8B8B] mt-0.5">{item} giờ trước</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8FFED] text-[#2F855A]">Mới</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8FFED] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-[#2D2D2D]">Sản phẩm bán chạy</h2>
            <button className="text-sm text-[#2F855A] hover:text-[#8FB491] font-medium">Xem tất cả</button>
          </div>
          <div className="space-y-4">
            {['Bánh mì tươi', 'Sữa chua', 'Bánh ngọt', 'Trái cây'].map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F8FFF9] transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#A4C3A2] to-[#2F855A] flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2D2D2D]">{product}</p>
                    <p className="text-xs text-[#8B8B8B]">{Math.floor(Math.random() * 100)} đã bán</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-[#2F855A]">{Math.floor(Math.random() * 500)}k₫</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
