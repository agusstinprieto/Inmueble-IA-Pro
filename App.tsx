
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import AnalysisView from './components/AnalysisView';
import PropertiesView from './components/PropertiesView';
import CRMView from './components/CRMView';
import ContractsView from './components/ContractsView';
import DashboardView from './components/DashboardView';
import MortgageCalculator from './components/MortgageCalculator';
import SalesView from './components/SalesView';
import AgentsView from './components/AgentsView';
import GalleryView from './components/GalleryView';
import MarketSearchView from './components/MarketSearchView';
import ValuationView from './components/ValuationView';
import MapView from './components/MapView';
import TourView from './components/TourView';
import AnalyticsView from './components/AnalyticsView';
import LoginView from './components/LoginView';
import { translations } from './translations';
import { supabase, getBusinessProfile, signOut, addProperty } from './services/supabase';
import {
  Property,
  Client,
  Contract,
  Sale,
  PropertyStatus,
  ClientStatus,
  Agent
} from './types';
import { Loader2, RefreshCw, Wifi, CloudOff } from 'lucide-react';

// ============ HELPERS ============

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// ============ MAIN APP ============

function App() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Business config
  const [businessName, setBusinessName] = useState('INMUEBLE IA PRO');
  const [location, setLocation] = useState('Torreón, Coahuila');
  const [brandColor, setBrandColor] = useState('#f59e0b');
  const [scriptUrl, setScriptUrl] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('admin');

  // App state
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data state
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const t = translations[lang];

  // ============ AUTH ============

  useEffect(() => {
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUserId(session.user.id);
        await loadProfile(session.user.id);
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserId(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        await loadProfile(session.user.id);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfile = async (uid: string) => {
    try {
      const profile = await getBusinessProfile(uid);
      if (profile) {
        setBusinessName(profile.business_name);
        setLocation(profile.location);
        setBrandColor(profile.branding_color || '#f59e0b');
        setScriptUrl(profile.script_url);
        setUserRole(profile.role);
      }
    } catch (err) {
      console.error('loadProfile error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsAuthenticated(false);
      setUserId(null);
      setProperties([]);
      setClients([]);
      setContracts([]);
      setSales([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ============ DATA SYNC ============

  const syncWithCloud = useCallback(async () => {
    if (!scriptUrl || isSyncing) return;

    setIsSyncing(true);
    try {
      const response = await fetch(scriptUrl);
      if (!response.ok) throw new Error('Sync failed');

      const data = await response.json();

      // Normalize and set data
      if (data.properties) setProperties(data.properties);
      if (data.clients) setClients(data.clients);
      if (data.contracts) setContracts(data.contracts);
      if (data.sales) setSales(data.sales);
      if (data.agents) setAgents(data.agents);

      setLastSync(new Date());
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [scriptUrl, isSyncing]);

  useEffect(() => {
    if (isAuthenticated && scriptUrl) {
      syncWithCloud();
    }
  }, [isAuthenticated, scriptUrl]);

  // Online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============ CRUD HANDLERS ============

  const handleAddProperty = async (property: Partial<Property>) => {
    const newProperty = {
      ...property,
      status: PropertyStatus.DISPONIBLE,
      agentId: userId || undefined,
      agencyId: undefined,
      views: 0,
      favorites: 0
    } as Partial<Property>;

    try {
      // Guardar en Supabase (esto automáticamente sincroniza con Sheets)
      const savedProperty = await addProperty(newProperty);

      if (savedProperty) {
        // Actualizar el estado local con la propiedad guardada
        setProperties(prev => [savedProperty, ...prev]);
        console.log('✅ Propiedad guardada y sincronizada con Sheets');
      }
    } catch (error) {
      console.error('❌ Error al guardar propiedad:', error);
    }
  };

  const handleEditProperty = (property: Property) => {
    setProperties(prev => prev.map(p => p.id === property.id ? property : p));
  };

  const handleDeleteProperty = (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const handleAddClient = (client: Partial<Client>) => {
    const newClient = {
      ...client,
      id: client.id || `client_${Date.now()}`,
      agentId: userId || '',
      status: ClientStatus.NUEVO,
      followUps: [],
      viewedProperties: [],
      dateAdded: new Date().toISOString()
    } as Client;

    setClients(prev => [newClient, ...prev]);
  };

  const handleUpdateClient = (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
  };

  const handleDeleteClient = (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const handleAddContract = (contract: Partial<Contract>) => {
    const newContract = {
      ...contract,
      id: contract.id || `contract_${Date.now()}`,
      agentId: userId || '',
      dateCreated: new Date().toISOString()
    } as Contract;

    setContracts(prev => [newContract, ...prev]);
  };

  const handleDeleteContract = (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    setContracts(prev => prev.filter(c => c.id !== id));
  };

  // ============ NAVIGATION ============

  const handleNavigate = (view: string) => {
    setActiveView(view);
  };

  // ============ RENDER ============

  // Loading screen
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: brandColor }} />
          <p className="text-zinc-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return <LoginView brandColor={brandColor} lang={lang} onToggleLang={() => setLang(l => l === 'es' ? 'en' : 'es')} />;
  }

  // Render active view
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            properties={properties}
            clients={clients}
            sales={sales}
            lang={lang}
            brandColor={brandColor}
            businessName={businessName}
          />
        );

      case 'analyze':
        return (
          <AnalysisView
            onAddProperty={handleAddProperty}
            lang={lang}
            businessName={businessName}
            location={location}
            brandColor={brandColor}
            agentId={userId || ''}
            agencyId=""
          />
        );

      case 'properties':
        return (
          <PropertiesView
            properties={properties}
            onAddProperty={handleAddProperty}
            onEditProperty={handleEditProperty}
            onDeleteProperty={handleDeleteProperty}
            onViewProperty={() => { }}
            lang={lang}
            brandColor={brandColor}
            businessName={businessName}
            location={location}
          />
        );

      case 'clients':
        return (
          <CRMView
            clients={clients}
            properties={properties}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            lang={lang}
            brandColor={brandColor}
            agentName={businessName}
          />
        );

      case 'contracts':
        return (
          <ContractsView
            contracts={contracts}
            properties={properties}
            clients={clients}
            onAddContract={handleAddContract}
            onDeleteContract={handleDeleteContract}
            lang={lang}
            brandColor={brandColor}
            businessName={businessName}
          />
        );

      case 'sales':
        return (
          <SalesView
            sales={sales}
            properties={properties}
            clients={clients}
            lang={lang}
            brandColor={brandColor}
            businessName={businessName}
          />
        );

      case 'agents':
        return (
          <AgentsView
            agents={agents}
            properties={properties}
            sales={sales}
            clients={clients}
            lang={lang}
            brandColor={brandColor}
            businessName={businessName}
          />
        );

      case 'calculator':
        return (
          <MortgageCalculator
            lang={lang}
            brandColor={brandColor}
          />
        );

      case 'gallery':
        return (
          <GalleryView
            properties={properties}
            lang={lang}
            brandColor={brandColor}
            onUpdateProperty={handleEditProperty}
          />
        );

      case 'market':
        return (
          <MarketSearchView
            properties={properties}
            lang={lang}
            brandColor={brandColor}
          />
        );

      case 'valuation':
        return (
          <ValuationView
            lang={lang}
            brandColor={brandColor}
            businessName={businessName}
          />
        );

      case 'map':
        return (
          <MapView
            properties={properties}
            lang={lang}
            brandColor={brandColor}
          />
        );

      case 'tours':
        return (
          <TourView
            properties={properties}
            lang={lang}
            brandColor={brandColor}
          />
        );

      case 'analytics':
        return (
          <AnalyticsView
            properties={properties}
            clients={clients}
            sales={sales}
            agents={agents}
            lang={lang}
            brandColor={brandColor}
          />
        );

      case 'settings':
        return (
          <div className="p-6 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-zinc-400 text-lg">Módulo en desarrollo</p>
              <p className="text-zinc-500 text-sm mt-2">Próximamente disponible</p>
            </div>
          </div>
        );

      default:
        return (
          <DashboardView
            properties={properties}
            clients={clients}
            sales={sales}
            lang={lang}
            brandColor={brandColor}
            businessName={businessName}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        lang={lang}
        businessName={businessName}
        brandColor={brandColor}
        userRole={userRole}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-y-auto bg-black lg:ml-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-lg border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="text-green-400" size={18} />
            ) : (
              <CloudOff className="text-red-400" size={18} />
            )}
            {lastSync && (
              <span className="text-zinc-500 text-sm">
                Sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={syncWithCloud}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg text-zinc-300 text-sm hover:bg-zinc-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>

            <button
              onClick={() => setLang(l => l === 'es' ? 'en' : 'es')}
              className="px-3 py-1.5 bg-zinc-800 rounded-lg text-zinc-300 text-sm hover:bg-zinc-700"
            >
              {lang.toUpperCase()}
            </button>
          </div>
        </div>

        {/* View Content */}
        {renderView()}

        {/* Footer */}
        <footer className="p-4 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-sm">
            Powered by <span className="text-zinc-400">Gemini AI</span> •
            Diseñado por <span style={{ color: brandColor }}>IA.AGUS</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
