import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import * as Icons from 'lucide-react';
import menuData from './menu.json';
import logoText from '../assets/image/logotext.png';

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
      className={`bg-white h-screen fixed left-0 top-0 transition-all duration-300 border-r border-[#B7E4C7] shadow-sm ${
        isCollapsed ? 'w-20' : 'w-64'
      } flex flex-col`}
    >
      {/* Logo Section */}
      <div className="p-5 border-b border-[#B7E4C7] flex items-center justify-between bg-gradient-to-r from-[#A4C3A2] to-[#8FB491]">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <img src={logoText} alt="SaveFood" className="h-10 object-contain brightness-0 invert" />
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto">
            <Icons.Store className="w-8 h-8 text-white" size={32} />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 bg-[#2F855A] border-2 border-white rounded-full p-1.5 hover:bg-[#8FB491] transition-colors shadow-lg z-10"
      >
        <Icons.ChevronLeft
          className={`w-4 h-4 text-white transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-[#B7E4C7] scrollbar-track-transparent">
        {menuData.mainMenu.map((menu: MenuItem) => (
          <div key={menu.id} className="mb-1.5">
            {/* Main Menu Item */}
            <button
              onClick={() => toggleMenu(menu.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                isActive(menu.link)
                  ? 'bg-[#E8FFED] text-[#2F855A] shadow-sm border border-[#B7E4C7]'
                  : 'text-[#6B6B6B] hover:bg-[#F8FFF9] hover:text-[#2F855A]'
              }`}
            >
              <div className="flex items-center space-x-3">
                {React.createElement(getIcon(menu.icon), {
                  className: `w-5 h-5 flex-shrink-0 ${isActive(menu.link) ? 'text-[#2F855A]' : ''}`,
                  size: 20
                })}
                {!isCollapsed && <span className="font-medium text-sm">{menu.title}</span>}
              </div>
              {!isCollapsed && menu.subMenu && (
                <Icons.ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    expandedMenu === menu.id ? 'rotate-180' : ''
                  }`}
                  size={16}
                />
              )}
            </button>

            {/* Sub Menu Items */}
            {!isCollapsed && menu.subMenu && expandedMenu === menu.id && (
              <div className="mt-1 ml-4 space-y-0.5">
                {menu.subMenu.map((subItem, index) => (
                  <Link
                    key={index}
                    to={subItem.link}
                    className={`block px-4 py-2.5 text-sm rounded-lg transition-colors ${
                      isActive(subItem.link)
                        ? 'bg-[#D9FFDF] text-[#2F855A] font-medium'
                        : 'text-[#6B6B6B] hover:bg-[#F8FFF9] hover:text-[#2F855A]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {subItem.icon ? (
                        React.createElement(getIcon(subItem.icon), {
                          className: 'w-4 h-4 flex-shrink-0 opacity-70',
                          size: 16
                        })
                      ) : (
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive(subItem.link) ? 'bg-[#2F855A]' : 'bg-current opacity-40'}`}></span>
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
        <div className="p-4 border-t border-[#B7E4C7] bg-[#F8FFF9]">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-[#B7E4C7]">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#2F855A] animate-pulse"></div>
              <p className="text-xs font-medium text-[#2F855A]">Hệ thống hoạt động</p>
            </div>
            <p className="text-xs text-[#8B8B8B]">Phiên bản v1.0.0</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
