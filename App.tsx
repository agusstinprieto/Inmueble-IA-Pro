
import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import AnalysisView from './components/properties/AnalysisView';
import PropertiesView from './components/properties/PropertiesView';
import CRMView from './components/crm/CRMView';
import ContractsView from './components/crm/ContractsView';
import DashboardView from './components/dashboard/DashboardView';
import MortgageCalculator from './components/tools/MortgageCalculator';
import SalesView from './components/sales/SalesView';
import AgentsView from './components/crm/AgentsView';
import GalleryView from './components/tools/GalleryView';
import MarketSearchView from './components/tools/MarketSearchView';
import ValuationView from './components/tools/ValuationView';
import MapView from './components/properties/MapView';
import TourView from './components/properties/TourView';
import AnalyticsView from './components/sales/AnalyticsView';
import LoginView from './components/auth/LoginView';
import SettingsView from './components/settings/SettingsView';
import BillingView from './components/settings/BillingView';
import PublicPortalView from './components/public/PublicPortalView';
import PublicPropertyDetail from './components/public/PublicPropertyDetail';
import LibraryView from './components/tools/LibraryView';
import NotaryDirectoryView from './components/tools/NotaryDirectoryView';
import AssistantView from './components/tools/AssistantView';
import PhotoStudioView from './components/tools/PhotoStudioView';
import UsageDashboardView from './components/dashboard/UsageDashboardView';
import { translations } from './translations';
import { updateAgencyProfile } from './services/supabase';
import { Property, Agency } from './types';
import { Loader2, RefreshCw, Wifi, CloudOff } from 'lucide-react';

// Custom Hooks
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { useSync } from './hooks/useSync';

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
  // Custom Hooks
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    userId,
    profile,
    agency,
    userRole,
    businessName,
    brandColor,
    location,
    logoUrl,
    scriptUrl,
    setProfile,
    setAgency,
    setBusinessName,
    setBrandColor,
    setLocation,
    setLogoUrl,
    handleLogout
  } = useAuth();

  const {
    properties,
    clients,
    agents,
    contracts,
    sales,
    setProperties,
    setClients,
    loadUserData,
    loadPublicData,
    handleAddProperty,
    handleEditProperty,
    handleDeleteProperty,
    handleAddClient,
    handleUpdateClient,
    handleDeleteClient,
    handleAddAgent,
    handleUpdateAgent,
    handleDeleteAgent,
    handleAddContract,
    handleDeleteContract,
    handleAddSale,
    handleToggleFavorite
  } = useData(userId, profile, agency, isAuthenticated);

  const { isSyncing, lastSync, isOnline, syncWithCloud } = useSync(loadUserData);

  // App state
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [activeView, setActiveView] = useState('dashboard');
  const [isPublicView, setIsPublicView] = useState(false);
  const [isGlobalView, setIsGlobalView] = useState(false);
  const [selectedPublicProperty, setSelectedPublicProperty] = useState<Property | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const [calculatorInitialPrice, setCalculatorInitialPrice] = useState<number>(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const t = translations[lang];

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Auto-sync when authenticated
  useEffect(() => {
    if (isAuthenticated && userId) {
      syncWithCloud();
    }
  }, [isAuthenticated, userId]);

  // ============ HANDLERS ============

  const handleUpdateAgency = async (data: { name: string; brandColor: string }) => {
    if (!profile?.agencyId) return false;

    try {
      const success = await updateAgencyProfile(profile.agencyId, {
        name: data.name,
        brandColor: data.brandColor
      });

      if (success) {
        setBusinessName(data.name);
        setBrandColor(data.brandColor);
        setAgency(prev => prev ? { ...prev, name: data.name, brandColor: data.brandColor } as Agency : null);

        localStorage.setItem('inmueble_businessName', data.name);
        localStorage.setItem('inmueble_brandColor', data.brandColor);
      }
      return success;
    } catch (error) {
      console.error('Error updating agency:', error);
      return false;
    }
  };

  const handleNavigate = (view: string) => {
    console.log(`🚀 Navegando a: ${view}`);
    setActiveView(view);
    setSidebarOpen(false);
  };

  const handleEditRequest = (property: Property) => {
    setPropertyToEdit(property);
    setActiveView('properties');
  };

  const handleOpenCalculator = (price: number) => {
    setCalculatorInitialPrice(price);
    setActiveView('calculator');
    setSidebarOpen(false);
  };

  // ============ RENDER ============

  // Loading screen
  if (isAuthLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300"
      >
        <div className="max-w-xs w-full">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: brandColor }} />
          <p className="text-zinc-400 mb-6">Cargando Inmueble IA Pro...</p>
        </div>

        <AssistantView
          lang={lang}
          userName={profile?.name || (userId ? 'Asociado' : 'Invitado')}
          agencyName={businessName}
        />
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <>
        <LoginView
          brandColor={brandColor}
          lang={lang}
          onToggleLang={() => setLang(l => l === 'es' ? 'en' : 'es')}
          onEnterGuest={(mode) => {
            if (mode === 'global') {
              setIsGlobalView(true);
              loadPublicData(true);
            } else {
              loadPublicData(false);
            }
            setIsPublicView(true);
          }}
        />
        <AssistantView
          lang={lang}
          userName={'Invitado'}
          agencyName={businessName}
        />
      </>
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
            onNavigate={handleNavigate}
            onViewPublic={() => setIsPublicView(true)}
          />
        );

      case 'analyze':
        return (
          <AnalysisView
            onAddProperty={(prop) => handleAddProperty(prop, () => setActiveView('properties'))}
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
            onAddProperty={(prop) => handleAddProperty(prop, () => setActiveView('properties'))}
            onEditProperty={handleEditProperty}
            onDeleteProperty={(id) => handleDeleteProperty(id, t.confirm_delete)}
            onViewProperty={() => { }}
            lang={lang}
            brandColor={brandColor}
            businessName={businessName}
            location={location}
            editingPropertyProp={propertyToEdit}
            onClearEditingProperty={() => setPropertyToEdit(null)}
            agents={agents}
            userRole={profile?.role || 'agent'}
            userId={userId || ''}
            onOpenCalculator={handleOpenCalculator}
            onToggleFavorite={handleToggleFavorite}
          />
        );

      case 'clients':
        return (
          <CRMView
            clients={clients}
            properties={properties}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={(id) => handleDeleteClient(id, t.confirm_delete)}
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
            onDeleteContract={(id) => handleDeleteContract(id, t.confirm_delete)}
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
            onAddAgent={handleAddAgent}
            onEditAgent={handleUpdateAgent}
            onDeleteAgent={handleDeleteAgent}
            lang={lang}
            brandColor={brandColor}
            businessName={businessName}
            onUpdateAgency={handleUpdateAgency}
          />
        );

      case 'calculator':
        return (
          <MortgageCalculator
            lang={lang}
            brandColor={brandColor}
            defaultPrice={calculatorInitialPrice > 0 ? calculatorInitialPrice : undefined}
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
            onPropertySelect={(property) => {
              setSelectedPublicProperty(property);
              setActiveView('property-detail');
            }}
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

      case 'sales':
        return (
          <SalesView
            sales={sales}
            properties={properties}
            clients={clients}
            onAddSale={handleAddSale}
            lang={lang}
            brandColor={brandColor}
            businessName={businessName}
            agentId={userId || ''}
          />
        );

      case 'library':
        return (
          <LibraryView
            lang={lang}
            brandColor={brandColor}
          />
        );

      case 'notary':
        return (
          <NotaryDirectoryView
            lang={lang}
            brandColor={brandColor}
            agencyId={profile?.agencyId}
          />
        );

      case 'photo-studio':
        return (
          <PhotoStudioView
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
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            lang={lang}
            setLang={setLang}
            scriptUrl={scriptUrl}
            setScriptUrl={(url) => { /* TODO: implement */ }}
            onSync={syncWithCloud}
            onSaveProfile={async () => {
              return await handleUpdateAgency({ name: businessName, brandColor });
            }}
            onNavigate={handleNavigate}
          />
        );

      case 'billing':
        return (
          <BillingView
            lang={lang}
            brandColor={brandColor}
          />
        );

      case 'usage':
        return (
          <UsageDashboardView
            lang={lang}
            brandColor={brandColor}
          />
        );

      case 'property-detail':
        return selectedPublicProperty ? (
          <PublicPropertyDetail
            property={selectedPublicProperty}
            lang={lang}
            brandColor={brandColor}
            onBack={() => setActiveView('map')}
          />
        ) : null;

      default:
        return <div>View not found</div>;
    }
  };

  // Public Portal View
  if (isPublicView) {
    return (
      <PublicPortalView
        properties={properties}
        lang={lang}
        brandColor={brandColor}
        businessName={businessName}
        onPropertySelect={(property) => {
          setSelectedPublicProperty(property);
          setActiveView('property-detail');
        }}
        onBack={() => setIsPublicView(false)}
      />
    );
  }

  // Main App
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-300">
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        businessName={businessName}
        brandColor={brandColor}
        lang={lang}
        onToggleLanguage={() => setLang(l => l === 'es' ? 'en' : 'es')}
        userRole={userRole}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onViewPublic={() => setIsPublicView(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 flex flex-col relative">
        {/* Sync Status Bar */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
          {isSyncing && (
            <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold">
              <CloudOff className="w-3.5 h-3.5 inline mr-1" />
              Sincronizando...
            </div>
          )}
          <div className={`px-3 py-1.5 rounded-full border text-xs font-bold ${isOnline ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
            <Wifi className="w-3.5 h-3.5 inline mr-1" />
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </div>
          <button onClick={() => syncWithCloud()} className="p-2 bg-zinc-900 border border-white/5 rounded-lg hover:bg-zinc-800">
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : 'text-white'}`} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {renderView()}
        </div>

        {/* AI Assistant */}
        <AssistantView
          lang={lang}
          userName={profile?.name || 'Usuario'}
          agencyName={businessName}
        />
      </main>
    </div>
  );
}

export default App;
