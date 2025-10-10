import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Plus, 
  FileText, 
  BarChart3, 
  Calendar,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ModernSidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-violet-600' },
    { id: 'pipeline', label: 'Projets', icon: FolderOpen, color: 'text-blue-600' },
    { id: 'create', label: 'Créer un projet', icon: Plus, color: 'text-green-600' },
    { id: 'dataroom', label: 'Dataroom', icon: FileText, color: 'text-amber-600' },
    { id: 'estimator', label: 'Estimateur', icon: BarChart3, color: 'text-purple-600' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-indigo-600' },
    { id: 'calendar', label: 'Calendrier', icon: Calendar, color: 'text-rose-600' },
  ];

  const handleMenuClick = (itemId) => {
    if (itemId === 'create') {
      setActiveTab('project-form');
    } else {
      setActiveTab(itemId);
    }
  };

  return (
    <div className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col h-screen ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">MDB</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-slate-800">MarchandsBiens</h1>
              <p className="text-xs text-slate-500">Gestion de projets</p>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'create' && activeTab === 'project-form');
          
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 shadow-md'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                isActive 
                  ? 'bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg' 
                  : 'bg-slate-100 group-hover:bg-slate-200'
              } transition-colors`}>
                <Icon className={`h-5 w-5 ${
                  isActive ? 'text-white' : item.color
                }`} />
              </div>
              
              {!isCollapsed && (
                <div className="flex-1">
                  <span className={`font-medium ${
                    isActive ? 'text-slate-800' : 'text-slate-600 group-hover:text-slate-800'
                  }`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="w-full h-0.5 bg-gradient-to-r from-violet-500 to-blue-600 rounded-full mt-1"></div>
                  )}
                </div>
              )}
              
              {isActive && (
                <div className="w-2 h-2 bg-gradient-to-br from-violet-500 to-blue-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings Section */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 hover:bg-slate-50`}
        >
          <div className="p-2 rounded-lg bg-slate-100">
            <Settings className="h-5 w-5 text-slate-600" />
          </div>
          {!isCollapsed && (
            <span className="font-medium text-slate-600">Paramètres</span>
          )}
        </button>

        {/* User Profile */}
        {user && (
          <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-50 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
              <User className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4 text-slate-600" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernSidebar;