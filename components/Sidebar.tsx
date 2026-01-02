
import React from 'react';
import {
  Home,
  Camera,
  Building2,
  Users,
  FileText,
  UserCircle,
  DollarSign,
  Image,
  Search,
  TrendingUp,
  Map,
  Video,
  Calculator,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Globe
} from 'lucide-react';
import { translations } from '../translations';
import { UserRole } from '../types';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  lang: 'es' | 'en';
  businessName: string;
  brandColor: string;
  userRole: UserRole;
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
  onViewPublic: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  badge?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  lang,
  businessName,
  brandColor,
  userRole,
  isOpen,
  onToggle,
  onLogout,
  onViewPublic
}) => {
  const t = translations[lang];

  const navItems: NavItem[] = [
    // Core
    { id: 'dashboard', label: t.dashboard, icon: <Home size={20} /> },
    { id: 'analyze', label: t.analyze, icon: <Camera size={20} />, badge: 'IA' },
    { id: 'properties', label: t.properties, icon: <Building2 size={20} /> },

    // CRM
    { id: 'clients', label: t.clients, icon: <Users size={20} /> },
    { id: 'contracts', label: t.contracts, icon: <FileText size={20} /> },

    // Agentes (solo admin)
    { id: 'agents', label: t.agents, icon: <UserCircle size={20} />, adminOnly: true },

    // Ventas
    { id: 'sales', label: t.sales, icon: <DollarSign size={20} /> },

    // Herramientas
    { id: 'gallery', label: t.gallery, icon: <Image size={20} /> },
    { id: 'market', label: t.market_search, icon: <Search size={20} />, badge: 'IA' },
    { id: 'valuation', label: t.valuation, icon: <TrendingUp size={20} />, badge: 'IA' },

    // Extras
    { id: 'map', label: t.map, icon: <Map size={20} /> },
    { id: 'tours', label: t.virtual_tours, icon: <Video size={20} /> },
    { id: 'calculator', label: t.mortgage_calc, icon: <Calculator size={20} /> },

    // Analytics (solo admin)
    { id: 'analytics', label: t.analytics, icon: <BarChart3 size={20} />, adminOnly: true },
  ];

  const isAdmin = ['agency_owner', 'branch_manager', 'super_admin'].includes(userRole);

  const filteredItems = navItems.filter(item =>
    !item.adminOnly || isAdmin
  );

  const getContrastColor = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const textColor = getContrastColor(brandColor);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-zinc-900 border-r border-zinc-800
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div
          className="p-4 border-b border-zinc-800"
          style={{ backgroundColor: brandColor }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={24} style={{ color: textColor }} />
              <div>
                <h1
                  className="font-bold text-lg leading-tight"
                  style={{ color: textColor }}
                >
                  INMUEBLE IA PRO
                </h1>
                <p
                  className="text-xs opacity-80"
                  style={{ color: textColor }}
                >
                  {businessName}
                </p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-1 rounded"
              style={{ color: textColor }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {filteredItems.map((item) => {
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    text-left text-sm font-medium
                    transition-all duration-150
                    ${isActive
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }
                  `}
                  style={isActive ? {
                    backgroundColor: brandColor + '20',
                    color: brandColor
                  } : {}}
                >
                  <span style={isActive ? { color: brandColor } : {}}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded"
                      style={{
                        backgroundColor: brandColor + '30',
                        color: brandColor
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Separator */}
          <div className="my-4 mx-3 border-t border-zinc-800" />

          <div className="px-3 mb-4">
            <button
              onClick={onViewPublic}
              className="
                w-full flex items-center gap-3 px-3 py-3 rounded-xl
                text-left text-sm font-black uppercase italic
                hover:opacity-80 transition-all duration-150
              "
              style={{
                backgroundColor: brandColor + '10',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: brandColor + '20',
                color: brandColor
              }}
            >
              <Globe size={20} />
              <span>Ver Sitio Público</span>
            </button>
          </div>

          {/* Settings & Logout */}
          <div className="px-3 space-y-1">
            <button
              onClick={() => onNavigate('settings')}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-left text-sm font-medium
                text-zinc-400 hover:text-white hover:bg-zinc-800
                transition-all duration-150
              `}
            >
              <Settings size={20} />
              <span>{t.settings}</span>
            </button>

            <button
              onClick={onLogout}
              className="
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-left text-sm font-medium
                text-red-400 hover:text-red-300 hover:bg-red-500/10
                transition-all duration-150
              "
            >
              <LogOut size={20} />
              <span>CERRAR SESIÓN</span>
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 text-center">
            Powered by <span className="text-zinc-400">Gemini AI</span>
          </p>
          <p className="text-xs text-zinc-600 text-center mt-1">
            {t.designed_by} IA.AGUS
          </p>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className="
          fixed bottom-4 right-4 z-30 lg:hidden
          w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center
          text-white
        "
        style={{ backgroundColor: brandColor }}
      >
        <Menu size={24} />
      </button>
    </>
  );
};

export default Sidebar;
