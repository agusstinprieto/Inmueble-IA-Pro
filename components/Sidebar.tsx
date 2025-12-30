
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
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, onClose, businessName, location }) => {
  const t = translations.es;

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'summary', label: t.summary, icon: <PieChart className="w-4 h-4" /> },
    { id: 'analysis', label: t.multimodal_analysis, icon: <Camera className="w-4 h-4" /> },
    { id: 'inventory', label: t.inventory, icon: <Package className="w-4 h-4" /> },
    { id: 'sales', label: t.sales, icon: <FileText className="w-4 h-4" /> },
    { id: 'search', label: t.smart_search, icon: <Search className="w-4 h-4" /> }
  ];

  return (
    <aside className="w-72 md:w-64 h-screen bg-[#0f0f0f] border-r border-white/5 flex flex-col shrink-0 overflow-hidden relative shadow-2xl md:shadow-none">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white bg-white/5 rounded-xl md:hidden z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="p-8 shrink-0">
        <h1 className="text-lg md:text-xl font-black italic tracking-tighter text-white uppercase leading-none">
          {businessName} <span className="text-amber-500">OS</span>
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
              ? 'bg-amber-500/10 text-amber-500 font-black'
              : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
          >
            {activeView === item.id && (
              <span className="absolute left-2 w-1 h-4 bg-amber-500 rounded-full" />
            )}
            <span className={`shrink-0 ${activeView === item.id ? 'text-amber-500' : 'text-zinc-600 group-hover:text-zinc-300'}`}>
              {item.icon}
            </span>
            <span className="text-[10px] uppercase tracking-widest font-bold truncate whitespace-nowrap">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5 shrink-0 bg-black/20 space-y-3">
        <div className="flex items-center gap-3 text-zinc-600 text-[9px] font-black uppercase tracking-widest truncate">
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
