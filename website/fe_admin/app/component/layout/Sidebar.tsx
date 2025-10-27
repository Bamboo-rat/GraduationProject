import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import * as Icons from 'lucide-react';
import menuData from './menu.json';
import logo from '../../assets/image/logo.png';

interface SubMenuItem {
  title: string;
  link: string;
  icon?: string;
}

interface MenuItem {
  id: number;
  title: string;
  icon: string;
  link: string;
  subMenu?: SubMenuItem[];
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleMenu = (menuId: number) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId);
  };

  const isActive = (link: string) => {
    return location.pathname === link || location.pathname.startsWith(link + '/');
  };

  // Dynamic icon component getter
  const getIcon = (iconName: string) => {
    const iconKey = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') as keyof typeof Icons;

    const IconComponent = Icons[iconKey] as React.ComponentType<{ className?: string; size?: number }>;
    return IconComponent || Icons.Briefcase;
  };

  return (
    <div
      className={`bg-gradient-to-b from-[#D9FFDF] to-[#E8FFED] h-screen fixed left-0 top-0 transition-all duration-300 border-r border-green-200 ${isCollapsed ? 'w-20' : 'w-64'
        } flex flex-col`}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-green-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <Link to="/">
              <img src={logo} alt="SaveFood" className="w-10 h-10 object-contain" />
            </Link>
            <div>
              <Link to="/">
                <h1 className="text-lg font-bold text-gray-800">SaveFood</h1>
                <p className="text-xs text-gray-600">Admin Portal</p>
              </Link>
            </div>
          </div>
        )}
        {isCollapsed && (
          <img src={logo} alt="SaveFood" className="w-10 h-10 object-contain mx-auto" />
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-white border border-green-200 rounded-full p-1.5 hover:bg-green-50 transition-colors shadow-md z-10"
      >
        <Icons.ChevronLeft
          className={`w-4 h-4 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-transparent">
        {menuData.mainMenu.map((menu: MenuItem) => (
          <div key={menu.id} className="mb-2">
            {/* Main Menu Item */}
            <div className="flex items-center gap-1">
              <Link
                to={menu.link}
                className={`flex-1 flex items-center px-3 py-2.5 rounded-lg transition-all ${isActive(menu.link)
                    ? 'bg-white text-green-700 shadow-md'
                    : 'text-gray-700 hover:bg-white/50'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  {React.createElement(getIcon(menu.icon), {
                    className: 'w-5 h-5 flex-shrink-0',
                    size: 20
                  })}
                  {!isCollapsed && <span className="font-medium text-sm">{menu.title}</span>}
                </div>
              </Link>
              {!isCollapsed && menu.subMenu && (
                <button
                  onClick={() => toggleMenu(menu.id)}
                  className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <Icons.ChevronDown
                    className={`w-4 h-4 transition-transform ${expandedMenu === menu.id ? 'rotate-180' : ''
                      }`}
                    size={16}
                  />
                </button>
              )}
            </div>

            {/* Sub Menu Items */}
            {!isCollapsed && menu.subMenu && expandedMenu === menu.id && (
              <div className="mt-1 ml-4 space-y-1">
                {menu.subMenu.map((subItem, index) => (
                  <Link
                    key={index}
                    to={subItem.link}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors ${isActive(subItem.link)
                        ? 'bg-green-100 text-green-700 font-medium'
                        : 'text-gray-600 hover:bg-white/50 hover:text-gray-800'
                      }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {subItem.icon ? (
                        React.createElement(getIcon(subItem.icon), {
                          className: 'w-4 h-4 flex-shrink-0 opacity-70',
                          size: 16
                        })
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>
                      )}
                      <span>{subItem.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-green-200">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-xs text-gray-600 mb-1">Phiên bản</p>
            <p className="text-sm font-semibold text-gray-800">v1.0.0</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;