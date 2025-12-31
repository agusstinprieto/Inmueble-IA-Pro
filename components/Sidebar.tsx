
import React from 'react';
import { translations } from '../translations';
import {
  LayoutDashboard,
  Camera,
  Package,
  FileText,
  Search,
  Globe,
  X,
  PieChart
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onClose?: () => void;
  businessName: string;
  location: string;
  lang: 'es' | 'en';
  onToggleLang: () => void;
  role: 'admin' | 'employee';
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  onClose,
  businessName,
  location,
  lang,
  onToggleLang,
  role
}) => {
  const t = translations[lang] || translations.es;

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'summary', label: t.summary, icon: <PieChart className="w-4 h-4" /> },
    { id: 'analysis', label: t.multimodal_analysis, icon: <Camera className="w-4 h-4" /> },
    { id: 'inventory', label: t.inventory, icon: <Package className="w-4 h-4" /> },
    { id: 'sales', label: t.sales, icon: <FileText className="w-4 h-4" /> },
    { id: 'search', label: t.smart_search, icon: <Search className="w-4 h-4" /> }
  ].filter(item => {
    if (role === 'employee' && (item.id === 'summary' || item.id === 'sales')) return false;
    return true;
  });

  return (
    <aside className="w-72 md:w-64 h-screen bg-[#0f0f0f] border-r border-white/5 flex flex-col shrink-0 overflow-hidden relative shadow-2xl md:shadow-none">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-white hover:text-white bg-white/5 rounded-xl md:hidden z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="p-8 shrink-0">
        <h1 className="text-lg md:text-xl font-black italic tracking-tighter text-white uppercase leading-none">
          {businessName} <span style={{ color: 'var(--brand-color)' }}>OS</span>
        </h1>
        <p className="text-[8px] text-white/30 uppercase tracking-[0.4em] font-black mt-2 truncate">
          Terminal v1.9 Multi-Tenant
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto custom-scrollbar pt-4">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full text-left px-5 py-4 rounded-2xl flex items-center gap-4 transition-all relative group overflow-hidden ${activeView === item.id
              ? 'text-white font-black'
              : 'text-white hover:text-white hover:bg-white/5'
              }`}
            style={activeView === item.id ? { backgroundColor: 'rgba(var(--brand-color-rgb), 0.1)', color: 'var(--brand-color)' } : {}}
          >
            {activeView === item.id && (
              <span className="absolute left-2 w-1 h-4 rounded-full" style={{ backgroundColor: 'var(--brand-color)' }} />
            )}
            <span className="shrink-0 transition-colors" style={{ color: activeView === item.id ? 'var(--brand-color)' : 'rgb(82 82 91)' }}>
              {item.icon}
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold truncate whitespace-nowrap">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 shrink-0 bg-black/20 space-y-4">
        <button
          onClick={onToggleLang}
          className="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-3.5 h-3.5 text-white group-hover:text-[var(--brand-color)] transition-colors" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">
              {lang === 'es' ? 'Español' : 'English'}
            </span>
          </div>
          <span
            className="text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter"
            style={{
              color: 'var(--brand-color)',
              backgroundColor: 'rgba(var(--brand-color-rgb), 0.1)'
            }}
          >
            {lang === 'es' ? 'Switch' : 'Cambiar'}
          </span>
        </button>

        <div className="flex items-center gap-3 text-white text-[9px] font-black uppercase tracking-widest truncate">
          <Globe className="w-3 h-3 shrink-0" /> {location}
        </div>

        <div className="pt-2 border-t border-white/5">
          <p className="text-[7px] font-black text-amber-500/50 uppercase tracking-widest leading-relaxed">
            POWERED BY IA.AGUS<br />
            +52 871 143 9941
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
