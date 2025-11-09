import { useNavigate } from 'react-router';
import { 
  Bell, 
  Lock, 
  Globe, 
  Moon, 
  Mail, 
  MessageSquare, 
  HelpCircle,
  Shield,
  User,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();

  const settingsSections = [
    {
      title: 'Giao diện',
      icon: SettingsIcon,
      items: [
        {
          label: 'Chủ đề',
          description: 'Chuyển đổi giữa chế độ sáng và tối',
          icon: Moon,
          onClick: () => alert('Chức năng đang phát triển'),
        },
        {
          label: 'Ngôn ngữ',
          description: 'Thay đổi ngôn ngữ hiển thị',
          icon: Globe,
          onClick: () => alert('Chức năng đang phát triển'),
        },
      ],
    },
    {
      title: 'Hỗ trợ',
      icon: HelpCircle,
      items: [
        {
          label: 'Trung tâm trợ giúp',
          description: 'Liên hệ với admin để được hỗ trợ',
          icon: MessageSquare,
          onClick: () => navigate('/chat'),
          highlight: true,
        },
        {
          label: 'Câu hỏi thường gặp',
          description: 'Xem các câu hỏi thường gặp',
          icon: HelpCircle,
          onClick: () => alert('Chức năng đang phát triển'),
        },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <SettingsIcon className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cài đặt</h1>
          <p className="text-gray-600">Quản lý cài đặt và tùy chọn của bạn</p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsSections.map((section, sectionIndex) => {
          const SectionIcon = section.icon;
          return (
            <div key={sectionIndex} className="card">
              {/* Section Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <SectionIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">{section.title}</h2>
                </div>
              </div>

              {/* Section Items */}
              <div className="divide-y divide-gray-100">
                {section.items.map((item, itemIndex) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={itemIndex}
                      onClick={item.onClick}
                      className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group ${
                        item.highlight ? 'bg-green-50 hover:bg-green-100' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.highlight 
                            ? 'bg-green-600 group-hover:bg-green-700' 
                            : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                          <ItemIcon className={`w-5 h-5 ${
                            item.highlight ? 'text-white' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="text-left">
                          <p className={`font-medium ${
                            item.highlight ? 'text-green-900' : 'text-gray-800'
                          }`}>
                            {item.label}
                          </p>
                          <p className={`text-sm ${
                            item.highlight ? 'text-green-700' : 'text-gray-500'
                          }`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${
                        item.highlight ? 'text-green-600' : 'text-gray-400'
                      } group-hover:translate-x-1 transition-transform`} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="card p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-100">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">Cần hỗ trợ?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Bạn có thắc mắc hoặc cần trợ giúp? Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn.
            </p>
            <button
              onClick={() => navigate('/chat')}
              className="btn-primary text-sm px-4 py-2 flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat với Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="text-center text-sm text-gray-500">
        <p>Phiên bản 1.0.0</p>
        <p className="mt-1">© 2025 SaveFood. All rights reserved.</p>
      </div>
    </div>
  );
}
