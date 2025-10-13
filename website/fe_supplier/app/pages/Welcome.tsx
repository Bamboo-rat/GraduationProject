import React, { useState } from 'react';
import SupplierRegistrationForm from '../component/SupplierRegistrationForm';
import logo from '../assets/image/logo.png';

const Welcome = () => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 relative overflow-hidden">
      {/* Background Animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header/Navbar */}
        <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src={logo} 
              alt="FoodSave Logo" 
              className="h-12 w-12 object-contain transform hover:scale-110 transition-transform" 
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              FoodSave
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/login" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
              Đăng nhập
            </a>
            <button
              onClick={() => setShowRegistrationForm(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Đăng ký ngay
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-block">
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  🌟 Nền tảng kết nối thực phẩm thông minh
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Kết nối
                <span className="bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent"> Nhà Bán Lẻ </span>
                với Khách Hàng
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Tham gia FoodSave để mở rộng thị trường, giảm lãng phí thực phẩm và tăng doanh thu của bạn. 
                Nền tảng quản lý đơn hàng thông minh, dễ dàng và hiệu quả.
              </p>

              {/* Features */}
              <div className="space-y-4">
                {[
                  { icon: '📱', text: 'Quản lý cửa hàng dễ dàng' },
                  { icon: '📊', text: 'Theo dõi doanh thu trực tuyến' },
                  { icon: '🚀', text: 'Tiếp cận hàng nghìn khách hàng' },
                  { icon: '💰', text: 'Giảm lãng phí, tăng lợi nhuận' },
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 group cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{feature.icon}</span>
                    <span className="text-gray-700 font-medium group-hover:text-green-600 transition-colors">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowRegistrationForm(true)}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-lg"
                >
                  Đăng ký trở thành đối tác
                </button>
                <button className="px-8 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg border-2 border-gray-200">
                  Tìm hiểu thêm
                </button>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="relative animate-float">
              <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-3xl p-8 shadow-2xl">
                {/* Mock Dashboard Preview */}
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg"></div>
                      <div>
                        <div className="h-3 w-24 bg-gray-200 rounded"></div>
                        <div className="h-2 w-16 bg-gray-100 rounded mt-2"></div>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-lg"></div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl">
                        <div className="h-2 w-12 bg-green-200 rounded mb-2"></div>
                        <div className="h-4 w-16 bg-green-400 rounded"></div>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="h-32 bg-gradient-to-t from-green-100 to-transparent rounded-xl flex items-end justify-around px-4 py-4">
                    {[40, 70, 50, 80, 60, 90, 75].map((height, i) => (
                      <div
                        key={i}
                        className="w-8 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 hover:from-green-600 hover:to-green-500"
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-xl animate-bounce-slow">
                  <span className="text-3xl">🎉</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center shadow-xl animate-bounce-slow animation-delay-1000">
                  <span className="text-2xl">⭐</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="container mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: '1000+', label: 'Nhà bán lẻ', icon: '🏪' },
              { number: '50K+', label: 'Đơn hàng/tháng', icon: '📦' },
              { number: '10K+', label: 'Khách hàng', icon: '👥' },
              { number: '95%', label: 'Hài lòng', icon: '⭐' },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 text-center"
              >
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <SupplierRegistrationForm onClose={() => setShowRegistrationForm(false)} />
      )}

      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
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
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default Welcome;
