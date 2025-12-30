
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import AnalysisView from './components/AnalysisView';
import InventoryView from './components/InventoryView';
import SalesView from './components/SalesView';
import SmartSearchView from './components/SmartSearchView';
import SummaryView from './components/SummaryView';
import LoginView, { ClientConfig } from './components/LoginView';
import { Part, PartStatus, PartCategory } from './types';
import { translations } from './translations';
import { supabase, getBusinessProfile, signOut } from './services/supabase';
import { Loader2, RefreshCw, Wifi, CloudFog, Menu as MenuIcon, X, LogOut } from 'lucide-react';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ?
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
    '245, 158, 11';
};

const App: React.FC = () => {
  const [activeClient, setActiveClient] = useState<ClientConfig | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [inventory, setInventory] = useState<Part[]>([]);
  const [salesRecords, setSalesRecords] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'error' | 'offline'>('offline');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const lastUserActionTimestamp = useRef<number>(0);
  const t = translations[lang] || translations.es;

  // Supabase auth state listener - check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await getBusinessProfile(session.user.id);
          if (profile) {
            setActiveClient({
              id: profile.business_id,
              name: profile.business_name,
              location: profile.location,
              scriptUrl: profile.script_url,
              brandingColor: profile.branding_color || '#f59e0b'
            });
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setActiveClient(null);
        setInventory([]);
        setSalesRecords([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut();
      setActiveClient(null);
      setInventory([]);
      setSalesRecords([]);
      setActiveView('dashboard');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const mapToCategory = (val: string): PartCategory => {
    if (!val) return PartCategory.OTROS;
    const clean = val.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const categories = Object.values(PartCategory);
    return categories.includes(clean as PartCategory) ? (clean as PartCategory) : PartCategory.OTROS;
  };

  const normalizeCloudData = (data: any[]): Part[] => {
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => {
      const parsePrice = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const cleaned = String(val).replace(/[$,]/g, '').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };

      const statusRaw = String(item.status || item.Status || item.Estado || '').toUpperCase();
      const isSold = statusRaw === 'SOLD' || statusRaw === 'VENDIDO' || statusRaw === 'VENDIDA';
      const cleanId = String(item.id || item.ID || item.Id || Math.random().toString(36).substr(2, 9)).trim();

      const rawPrice = item.precio || item.price || item.suggestedPrice || 0;
      const rawFinalPrice = item.finalPrice || item.precioVenta || item.precio_venta || item.total || 0;

      return {
        id: cleanId,
        name: String(item.parte || item.name || item.Parte || "Pieza"),
        category: mapToCategory(item.categoria || item.category || ''),
        status: isSold ? PartStatus.SOLD : PartStatus.AVAILABLE,
        condition: String(item.condicion || item.condition || "Usada"),
        suggestedPrice: parsePrice(rawPrice),
        minPrice: parsePrice(item.minPrice || 0),
        finalPrice: rawFinalPrice ? parsePrice(rawFinalPrice) : (isSold ? parsePrice(rawPrice) : undefined),
        dateAdded: String(item.fecha || item.dateAdded || item.fechaVenta || new Date().toISOString()),
        vehicleInfo: {
          year: Number(item.anio || item.year || 0),
          make: String(item.marca || item.make || "N/A"),
          model: String(item.modelo || item.model || "N/A"),
          trim: String(item.trim || ""),
          vin: String(item.vin || "")
        }
      };
    });
  };

  const fetchCloudData = useCallback(async (sheet: string = "INVENTARIO") => {
    if (!activeClient || !navigator.onLine) return [];
    try {
      const response = await fetch(`${activeClient.scriptUrl}?sheet=${sheet}&nocache=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      return normalizeCloudData(data);
    } catch (err) {
      console.error(`Error fetching ${sheet}:`, err);
      setCloudStatus('error');
      return [];
    }
  }, [activeClient]);

  const syncAll = useCallback(async (force = false) => {
    if (!activeClient) return;
    if (!force && (Date.now() - lastUserActionTimestamp.current < 20000)) return;
    setIsLoading(true);

    try {
      const [inv, sales] = await Promise.all([
        fetchCloudData("INVENTARIO"),
        fetchCloudData("VENTAS")
      ]);

      setInventory(inv);
      setSalesRecords(sales);
      setCloudStatus('connected');
    } catch (e) {
      setCloudStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchCloudData, activeClient]);

  useEffect(() => {
    if (activeClient) {
      syncAll(true);
      document.title = `${activeClient.name} OS`;
    } else {
      document.title = 'Autopartenon OS';
    }
  }, [syncAll, activeClient]);

  const sendActionToCloud = async (payload: any) => {
    if (!activeClient || !navigator.onLine) return false;
    setIsSyncing(true);
    try {
      const targetSheet = payload.targetSheet || 'INVENTARIO';
      const finalPayload = {
        action: payload.action || 'ADD',
        sheet: targetSheet,
        id: String(payload.id),
        parte: payload.parte || payload.name || '',
        categoria: payload.categoria || payload.category || '',
        marca: payload.marca || payload.vehicleInfo?.make || '',
        modelo: payload.modelo || payload.vehicleInfo?.model || '',
        anio: payload.anio || payload.vehicleInfo?.year || '',
        condicion: payload.condicion || payload.condition || 'Usada',
        precio: payload.precio || payload.suggestedPrice || 0,
        minPrice: payload.minPrice || 0,
        finalPrice: payload.finalPrice || payload.precioVenta || 0,
        status: payload.status || 'AVAILABLE',
        vin: payload.vin || payload.vehicleInfo?.vin || '',
        fecha: payload.fecha || new Date().toISOString(),
        timestamp: new Date().toISOString()
      };

      await fetch(activeClient.scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(finalPayload)
      });

      setCloudStatus('connected');
      return true;
    } catch (e) {
      console.error("Cloud Error:", e);
      setCloudStatus('error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSellPart = async (id: string, price: number) => {
    lastUserActionTimestamp.current = Date.now();
    const partToUpdate = inventory.find(p => p.id === id);
    if (!partToUpdate) return;

    setInventory(prev => prev.filter(p => p.id !== id));
    setSalesRecords(prev => [{ ...partToUpdate, status: PartStatus.SOLD, finalPrice: price }, ...prev]);

    await sendActionToCloud({
      action: "SELL",
      targetSheet: "VENTAS",
      id,
      finalPrice: price,
      precioVenta: price,
      marca: partToUpdate.vehicleInfo.make,
      modelo: partToUpdate.vehicleInfo.model,
      anio: partToUpdate.vehicleInfo.year,
      parte: partToUpdate.name,
      categoria: partToUpdate.category,
      status: "SOLD"
    });

    setTimeout(() => syncAll(true), 3000);
  };

  const handleDeletePart = async (id: string) => {
    lastUserActionTimestamp.current = Date.now();
    const partToDelete = inventory.find(p => p.id === id);
    if (!partToDelete) return;

    setInventory(prev => prev.filter(p => p.id !== id));

    await sendActionToCloud({
      action: "DELETE",
      targetSheet: "ELIMINADOS",
      id,
      marca: partToDelete.vehicleInfo.make,
      modelo: partToDelete.vehicleInfo.model,
      anio: partToDelete.vehicleInfo.year,
      parte: partToDelete.name,
      categoria: partToDelete.category
    });

    setTimeout(() => syncAll(true), 3000);
  };

  const handleAddParts = useCallback(async (newParts: Part[]) => {
    lastUserActionTimestamp.current = Date.now();
    setInventory(prev => [...newParts, ...prev]);
    setActiveView('inventory');

    for (let i = 0; i < newParts.length; i++) {
      const p = newParts[i];
      await sendActionToCloud({
        action: "ADD",
        targetSheet: "INVENTARIO",
        ...p,
        marca: p.vehicleInfo.make,
        modelo: p.vehicleInfo.model,
        anio: p.vehicleInfo.year,
        parte: p.name,
        precio: p.suggestedPrice
      });
      if (newParts.length > 1) await new Promise(r => setTimeout(r, 600));
    }

    setTimeout(() => syncAll(true), 4000);
  }, [inventory, activeClient]);

  const handleNavigate = (view: string) => {
    setActiveView(view);
    setIsSidebarOpen(false);
  };

  // Show loading while checking auth
  if (isAuthLoading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!activeClient) return <LoginView onLogin={(client) => setActiveClient(client)} />;

  const brandColor = activeClient.brandingColor || '#f59e0b';

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black text-white overflow-hidden">
      <style>{`
        :root {
          --brand-color: ${brandColor};
          --brand-color-rgb: ${brandColor.startsWith('#') ? hexToRgb(brandColor) : '245, 158, 11'};
        }
        .text-amber-500 { color: var(--brand-color) !important; }
        .bg-amber-500 { background-color: var(--brand-color) !important; }
        .border-amber-500 { border-color: var(--brand-color) !important; }
        .focus\\:border-amber-500:focus { border-color: var(--brand-color) !important; }
        .hover\\:text-amber-500:hover { color: var(--brand-color) !important; }
        .hover\\:bg-amber-400:hover { filter: brightness(1.1); background-color: var(--brand-color) !important; }
        .active\\:scale-95:active { transform: scale(0.95); }
        
        /* Specialized overrides for Opacity and Shorthands */
        .bg-amber-500\\/10 { background-color: rgba(var(--brand-color-rgb), 0.1) !important; }
        .bg-amber-500\\/5 { background-color: rgba(var(--brand-color-rgb), 0.05) !important; }
        .border-amber-500\\/20 { border-color: rgba(var(--brand-color-rgb), 0.2) !important; }
        .border-amber-500\\/30 { border-color: rgba(var(--brand-color-rgb), 0.3) !important; }
        .border-amber-500\\/50 { border-color: rgba(var(--brand-color-rgb), 0.5) !important; }
        .text-amber-500\\/60 { color: rgba(var(--brand-color-rgb), 0.6) !important; }
        .shadow-amber-500\\/10 { --tw-shadow-color: rgba(var(--brand-color-rgb), 0.1); --tw-shadow: var(--tw-shadow-colored); }
        .shadow-amber-500\\/20 { --tw-shadow-color: rgba(var(--brand-color-rgb), 0.2); --tw-shadow: var(--tw-shadow-colored); }
      `}</style>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-[70] transition-transform duration-300 transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          onClose={() => setIsSidebarOpen(false)}
          businessName={activeClient.name}
          location={activeClient.location}
        />
      </div>

      <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar relative">
        <div className="flex md:hidden items-center justify-between p-4 bg-zinc-900 border-b border-white/5 shrink-0 sticky top-0 z-50 w-full overflow-hidden">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-amber-500 bg-white/5 rounded-xl">
              <MenuIcon className="w-6 h-6" />
            </button>
            <button onClick={handleLogout} className="p-2 text-zinc-500 bg-white/5 rounded-xl" title="Cerrar sesión">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-xs font-black italic tracking-tighter text-white uppercase truncate px-2">
            {activeClient.name} <span className="text-amber-500">OS</span>
          </h1>
          <button onClick={() => syncAll(true)} className="p-2 text-zinc-500 bg-white/5 rounded-xl">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>

        <div className="hidden md:flex absolute top-4 right-8 items-center gap-3 z-50">
          {isSyncing && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest animate-pulse shrink-0">
              <CloudFog className="w-3 h-3" /> Escribiendo...
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shrink-0 ${cloudStatus === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
            <Wifi className="w-3 h-3" /> {cloudStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
          </div>
          <button onClick={() => syncAll(true)} className="p-2 bg-zinc-900 border border-white/5 rounded-lg hover:bg-zinc-800 transition-colors shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : 'text-zinc-400'}`} />
          </button>
          <button onClick={handleLogout} className="p-2 bg-zinc-900 border border-white/5 rounded-lg hover:bg-red-900/50 hover:border-red-500/30 transition-colors shrink-0" title="Cerrar sesión">
            <LogOut className="w-3.5 h-3.5 text-zinc-400 hover:text-red-400" />
          </button>
        </div>

        <div className="flex-1">
          {activeView === 'dashboard' && (
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 animate-in fade-in duration-500 overflow-x-hidden pt-6 md:pt-8">
              <header className="overflow-hidden">
                <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase truncate">{t.operational_dashboard}</h2>
                <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase mt-1 truncate">Terminal de Control • {activeClient.location}</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-zinc-900/50 border border-white/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
                  <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 truncate">{t.available_stock}</p>
                  <p className="text-3xl md:text-4xl lg:text-5xl font-black text-white italic truncate">{inventory.length}</p>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
                  <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 truncate">{t.total_revenue}</p>
                  <p className="text-3xl md:text-4xl lg:text-5xl font-black text-green-500 italic truncate">${salesRecords.reduce((acc, p) => acc + (p.finalPrice || 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden">
                  <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 truncate">Valor Inventario</p>
                  <p className="text-3xl md:text-4xl lg:text-5xl font-black text-blue-400 italic truncate">${inventory.reduce((acc, p) => acc + (p.suggestedPrice || 0), 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {activeView === 'summary' && <SummaryView inventory={inventory} lang={lang} location={activeClient.location} />}
          {activeView === 'analysis' && <AnalysisView onAddParts={handleAddParts} lang={lang} businessName={activeClient.name} location={activeClient.location} />}
          {activeView === 'inventory' && (
            <InventoryView
              inventory={inventory}
              onSellPart={handleSellPart}
              onDeletePart={handleDeletePart}
              lang={lang}
              businessName={activeClient.name}
              location={activeClient.location}
            />
          )}
          {activeView === 'sales' && <SalesView salesHistory={salesRecords} onRefresh={() => syncAll(true)} lang={lang} businessName={activeClient.name} location={activeClient.location} />}
          {activeView === 'search' && <SmartSearchView lang={lang} location={activeClient.location} />}
        </div>

        <footer className="mt-auto py-8 px-4 md:px-8 border-t border-white/5 bg-black/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
              Terminal Conectada: <span className="text-amber-500">{activeClient.id.toUpperCase()}</span>
            </p>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} {activeClient.name} Systems
            </p>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full border border-amber-500/10">
              Diseñado por IA.AGUS - Tel +52 871 143 9941
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
