import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import * as Icons from 'lucide-react';
import menuData from './menu.json';
import logo from '~/assets/image/logo.png';

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
      className={`bg-surface h-screen fixed left-0 top-0 transition-all duration-300 border-r border-default shadow-sm z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      } flex flex-col`}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-default bg-surface-light">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <img src={logo} alt="SaveFood" className="h-8 object-contain" />
              <div>
                <h1 className="text-lg font-bold text-text">SaveFood</h1>
                <p className="text-xs text-text-light">Supplier Portal</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1">
              <img src={logo} alt="SaveFood" className="h-8 object-contain" />
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 bg-primary border-2 border-surface rounded-full p-1.5 hover:bg-primary-dark transition-all duration-200 shadow-lg z-10 hover:shadow-xl"
      >
        <Icons.ChevronLeft
          className={`w-4 h-4 text-surface transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin scrollbar-thumb-primary-light scrollbar-track-transparent">
        <div className="space-y-1.5">
          {menuData.mainMenu.map((menu: MenuItem) => {
            const IconComponent = getIcon(menu.icon);
            const isMenuActive = isActive(menu.link);
            const isMenuExpanded = expandedMenu === menu.id;

            return (
              <div key={menu.id} className="relative">
                {/* Main Menu Item */}
                <button
                  onClick={() => toggleMenu(menu.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                    isMenuActive
                      ? 'bg-primary-lighter text-secondary border border-primary shadow-sm'
                      : 'text-text-muted hover:bg-surface-light hover:text-text border border-transparent'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                    <div className={`relative ${isMenuActive ? 'text-secondary' : 'text-text-light group-hover:text-primary'}`}>
                      <IconComponent className="w-5 h-5 flex-shrink-0" size={20} />
                      {isMenuActive && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full"></div>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className="font-medium text-sm text-left">{menu.title}</span>
                    )}
                  </div>
                  
                  {!isCollapsed && menu.subMenu && (
                    <Icons.ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isMenuExpanded ? 'rotate-180 text-secondary' : 'text-text-light'
                      }`}
                      size={16}
                    />
                  )}
                </button>

                {/* Sub Menu Items */}
                {!isCollapsed && menu.subMenu && isMenuExpanded && (
                  <div className="mt-2 ml-4 space-y-1.5 animate-fade-in">
                    {menu.subMenu.map((subItem, index) => {
                      const isSubActive = isActive(subItem.link);
                      const SubIconComponent = subItem.icon ? getIcon(subItem.icon) : null;
                      
                      return (
                        <Link
                          key={index}
                          to={subItem.link}
                          className={`block p-3 text-sm rounded-lg transition-all duration-200 border ${
                            isSubActive
                              ? 'bg-primary-lighter text-secondary border-primary shadow-sm'
                              : 'text-text-muted hover:bg-surface-light hover:text-text border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {SubIconComponent ? (
                              <SubIconComponent 
                                className={`w-4 h-4 flex-shrink-0 ${isSubActive ? 'text-secondary' : 'text-text-light'}`} 
                                size={16} 
                              />
                            ) : (
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                isSubActive ? 'bg-secondary' : 'bg-text-light'
                              }`}></div>
                            )}
                            <span className={isSubActive ? 'font-medium' : ''}>{subItem.title}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && menu.subMenu && (
                  <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-text text-surface text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-48">
                    <div className="font-medium mb-1">{menu.title}</div>
                    <div className="space-y-1">
                      {menu.subMenu.map((subItem, index) => (
                        <div key={index} className="text-text-light text-xs">
                          {subItem.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className={`border-t border-default bg-surface-light ${isCollapsed ? 'p-3' : 'p-4'}`}>
        {!isCollapsed ? (
          <div className="card p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              <p className="text-sm font-medium text-secondary">Hệ thống hoạt động</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-text-light">Phiên bản v1.0.0</p>
              <div className="flex space-x-1">
                <div className="w-1 h-1 rounded-full bg-text-light"></div>
                <div className="w-1 h-1 rounded-full bg-text-light"></div>
                <div className="w-1 h-1 rounded-full bg-text-light"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
            <Icons.Settings className="w-5 h-5 text-text-light" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;