
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
import SettingsView from './components/SettingsView';
import PublicPortalView from './components/PublicPortalView';
import PublicPropertyDetail from './components/PublicPropertyDetail';
import { translations } from './translations';
import {
  supabase, getBusinessProfile, signOut, addProperty, getProperties, uploadPropertyImages, updateProperty, deleteProperty, updateBusinessProfile, getAgents, addAgent, updateAgent, deleteAgent, addSale, updateClient,
  getClients,
  addClient,
  deleteClient,
  getContracts,
  addContract,
  deleteContract,
  getSales
} from './services/supabase';
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

  // Business config - with localStorage cache for instant load
  const [businessName, setBusinessName] = useState(() => localStorage.getItem('inmueble_businessName') || 'INMUEBLE IA PRO');
  const [location, setLocation] = useState(() => localStorage.getItem('inmueble_location') || 'Torreón, Coahuila');
  const [brandColor, setBrandColor] = useState(() => localStorage.getItem('inmueble_brandColor') || '#f59e0b');
  const [scriptUrl, setScriptUrl] = useState(() => localStorage.getItem('inmueble_scriptUrl') || '');
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('admin');

  // App state
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPublicView, setIsPublicView] = useState(false);
  const [selectedPublicProperty, setSelectedPublicProperty] = useState<Property | null>(null);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);

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

  // Bypass button state
  const [showBypass, setShowBypass] = useState(false);

  useEffect(() => {
    checkSession();

    // Fallback: Si por alguna razón la sesión tarda demasiado, habilitamos el botón de entrada manual
    const bypassTimer = setTimeout(() => setShowBypass(true), 4000);

    // Hard fallback: Después de 7 segundos, forzamos la entrada
    const hardExitTimer = setTimeout(() => {
      setIsLoading(prev => {
        if (prev) {
          console.warn('⚠️ Salida forzada de pantalla de carga (Hard Exit)');
          return false;
        }
        return prev;
      });
    }, 7000);

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUserId(session.user.id);
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUserId(null);
        setProperties([]);
        setClients([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(bypassTimer);
      clearTimeout(hardExitTimer);
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      // Intentar cargar propiedades públicas independientemente de la sesión
      loadPublicData();
      // Small delay to ensure smooth transition
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const loadPublicData = async () => {
    try {
      const props = await getProperties();
      setProperties(props);
    } catch (err) {
      console.error('loadPublicData error:', err);
    }
  };

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      loadProfile(userId);
    }
  }, [isAuthenticated, userId]);

  const loadProfile = async (uid: string) => {
    try {
      const profile = await getBusinessProfile(uid);
      if (profile) {
        setBusinessName(profile.business_name);
        setLocation(profile.location);
        setBrandColor(profile.branding_color || '#f59e0b');
        setScriptUrl(profile.script_url);
        setUserRole(profile.role);

        // Sync to localStorage for instant load on next visit
        localStorage.setItem('inmueble_businessName', profile.business_name);
        localStorage.setItem('inmueble_location', profile.location);
        localStorage.setItem('inmueble_brandColor', profile.branding_color || '#f59e0b');
        localStorage.setItem('inmueble_scriptUrl', profile.script_url || '');
      }
      // Load data after profile
      await loadData();
    } catch (err) {
      console.error('loadProfile error:', err);
    }
  };

  const loadData = async () => {
    try {
      const [props, ags, cls, conts, sls] = await Promise.all([
        getProperties(),
        getAgents(),
        getClients(),
        getContracts(),
        getSales()
      ]);
      setProperties(props);
      setAgents(ags);
      setClients(cls);
      setContracts(conts);
      setSales(sls);
      console.log(`✅ Loaded ${props.length} props, ${ags.length} agents, ${cls.length} clients`);
    } catch (err) {
      console.error('loadData error:', err);
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
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      // Load all data from Supabase
      await loadData();
      setLastSync(new Date());
      console.log('✅ Sincronización completada');
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

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
    try {
      // Generate temp ID for image upload
      const tempId = `prop_${Date.now()}`;

      // Upload images if they exist and are blob URLs
      let imageUrls: string[] = [];
      if (property.images && property.images.length > 0) {
        console.log(`📸 Uploading ${property.images.length} images to Supabase Storage...`);
        imageUrls = await uploadPropertyImages(property.images, tempId);
        console.log(`✅ Uploaded ${imageUrls.length} images`);
      }

      const newProperty = {
        ...property,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        status: PropertyStatus.DISPONIBLE,
        agentId: userId || undefined,
        agencyId: undefined,
        views: 0,
        favorites: 0
      } as Partial<Property>;

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

  const handleEditProperty = async (property: Property) => {
    try {
      const updated = await updateProperty(property);
      if (updated) {
        setProperties(prev => prev.map(p => p.id === property.id ? updated : p));
        console.log('✅ Propiedad actualizada en BD y Sheets');
      }
    } catch (error) {
      console.error('❌ Error al editar propiedad:', error);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try {
      const success = await deleteProperty(id);
      if (success) {
        setProperties(prev => prev.filter(p => p.id !== id));
        console.log('✅ Propiedad eliminada de BD');
      }
    } catch (error) {
      console.error('❌ Error al eliminar propiedad:', error);
    }
  };

  const handleAddClient = async (client: Partial<Client>) => {
    try {
      const newClient = await addClient(client);
      if (newClient) {
        setClients(prev => [newClient, ...prev]);
        console.log('✅ Cliente guardado en BD');
      }
    } catch (error) {
      console.error('❌ Error al guardar cliente:', error);
    }
  };

  const handleUpdateClient = async (client: Client) => {
    try {
      const updated = await updateClient(client);
      if (updated) {
        setClients(prev => prev.map(c => c.id === client.id ? updated : c));
        console.log('✅ Cliente actualizado en BD');
      }
    } catch (error) {
      console.error('❌ Error al actualizar cliente:', error);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try {
      const success = await deleteClient(id);
      if (success) {
        setClients(prev => prev.filter(c => c.id !== id));
        console.log('✅ Cliente eliminado de BD');
      }
    } catch (error) {
      console.error('❌ Error al eliminar cliente:', error);
    }
  };

  // ============ AGENTS HANDLERS ============

  const handleAddAgent = async (agent: Partial<Agent>) => {
    const newAgent = await addAgent(agent);
    if (newAgent) {
      setAgents(prev => [...prev, newAgent]);
    }
  };

  const handleUpdateAgent = async (agent: Agent) => {
    const updated = await updateAgent(agent);
    if (updated) {
      setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
    }
  };

  const handleDeleteAgent = async (id: string) => {
    const success = await deleteAgent(id);
    if (success) {
      setAgents(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleAddContract = async (contract: Partial<Contract>) => {
    try {
      const newContract = await addContract(contract);
      if (newContract) {
        setContracts(prev => [newContract, ...prev]);
        console.log('✅ Contrato guardado en BD');
      }
    } catch (error) {
      console.error('❌ Error al guardar contrato:', error);
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try {
      const success = await deleteContract(id);
      if (success) {
        setContracts(prev => prev.filter(c => c.id !== id));
        console.log('✅ Contrato eliminado de BD');
      }
    } catch (error) {
      console.error('❌ Error al eliminar contrato:', error);
    }
  };

  // ============ SALES HANDLERS ============

  // Handle new sale
  const handleAddSale = async (sale: Sale) => {
    try {
      setSales(prev => [sale, ...prev]);

      // Update property status
      const property = properties.find(p => p.id === sale.propertyId);
      if (property) {
        const newStatus = sale.type === 'VENTA' ? PropertyStatus.VENDIDA : PropertyStatus.RENTADA;
        const updatedProperty = { ...property, status: newStatus };

        // Optimistic update
        setProperties(prev => prev.map(p => p.id === property.id ? updatedProperty : p));

        // Persist
        await updateProperty(updatedProperty);
      }

      // Update client status
      const client = clients.find(c => c.id === sale.clientId);
      if (client) {
        const updatedClient = { ...client, status: ClientStatus.CERRADO };

        // Optimistic update
        setClients(prev => prev.map(c => c.id === client.id ? updatedClient : c));

        // Persist
        await updateClient(updatedClient);
      }
    } catch (error) {
      console.error('Error handling new sale:', error);
    }
  };

  // Add Sale Request
  const handleAddSaleRequest = async (newSaleData: any) => {
    try {
      const addedSale = await addSale(newSaleData);
      if (addedSale) {
        handleAddSale(addedSale);
      }
    } catch (error) {
      console.error('Error creating sale:', error);
    }
  };

  // ============ NAVIGATION ============

  const handleNavigate = (view: string) => {
    console.log(`🚀 Navegando a: ${view}`);
    setActiveView(view);
    setSidebarOpen(false);
  };

  const handleEditRequest = (property: Property) => {
    setPropertyToEdit(property);
    setActiveView('properties');
  };

  // ============ RENDER ============

  // Loading screen
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        <div className="max-w-xs w-full">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: brandColor }} />
          <p className="text-zinc-400 mb-6">Cargando Inmueble IA Pro...</p>

          {showBypass && (
            <button
              onClick={() => setIsLoading(false)}
              className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-all animate-in fade-in slide-in-from-bottom-2"
              style={{ border: `1px solid ${brandColor}40` }}
            >
              ¿Tarda demasiado? Entrar ahora
            </button>
          )}
        </div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <LoginView
        brandColor={brandColor}
        lang={lang}
        onToggleLang={() => setLang(l => l === 'es' ? 'en' : 'es')}
        onEnterGuest={() => setIsPublicView(true)}
      />
    );
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
            onNavigate={(v) => {
              console.log('Dashboard click:', v);
              handleNavigate(v);
            }}
            onViewPublic={() => setIsPublicView(true)}
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
            editingPropertyProp={propertyToEdit}
            onClearEditingProperty={() => setPropertyToEdit(null)}
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
            onAddSale={handleAddSaleRequest}
          />
        );

      case 'agents':
        return (
          <AgentsView
            agents={agents}
            properties={properties}
            sales={sales}
            clients={clients}
            onAddAgent={handleAddAgent}
            onEditAgent={handleUpdateAgent}
            onDeleteAgent={handleDeleteAgent}
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
            onEditRequest={handleEditRequest}
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
            onUpdateProperty={handleEditProperty}
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
          <SettingsView
            businessName={businessName}
            setBusinessName={setBusinessName}
            location={location}
            setLocation={setLocation}
            brandColor={brandColor}
            setBrandColor={setBrandColor}
            lang={lang}
            setLang={setLang}
            scriptUrl={scriptUrl}
            setScriptUrl={setScriptUrl}
            onSync={syncWithCloud}
            onSaveProfile={async () => {
              if (userId) {
                const success = await updateBusinessProfile(userId, {
                  business_name: businessName,
                  location: location,
                  branding_color: brandColor,
                  script_url: scriptUrl,
                  role: userRole
                });
                if (success) {
                  // Sync to localStorage immediately on save
                  localStorage.setItem('inmueble_businessName', businessName);
                  localStorage.setItem('inmueble_location', location);
                  localStorage.setItem('inmueble_brandColor', brandColor);
                  localStorage.setItem('inmueble_scriptUrl', scriptUrl);
                }
                return success;
              }
              return false;
            }}
          />
        );

      default:
        console.log(`⚠️ Vista desconocida o directa: ${activeView}, cargando dashboard`);
        return (
          <DashboardView
            properties={properties}
            clients={clients}
            sales={sales}
            lang={lang}
            brandColor={brandColor}
            businessName={businessName}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  // ============ PUBLIC VIEW LOGIC ============
  if (isPublicView) {
    if (selectedPublicProperty) {
      return (
        <PublicPropertyDetail
          property={selectedPublicProperty}
          lang={lang}
          brandColor={brandColor}
          agencyName={businessName}
          onBack={() => setSelectedPublicProperty(null)}
        />
      );
    }
    return (
      <PublicPortalView
        properties={properties}
        lang={lang}
        brandColor={brandColor}
        agencyName={businessName}
        onViewDetail={(p) => setSelectedPublicProperty(p)}
        onExitPublic={() => setIsPublicView(false)}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  // ============ RENDER MAIN ============
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
        onViewPublic={() => setIsPublicView(true)}
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
