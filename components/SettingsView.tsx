
import React, { useState } from 'react';
import {
    Settings,
    Save,
    Palette,
    Building2,
    MapPin,
    Database,
    Languages,
    CheckCircle,
    RefreshCw,
    ExternalLink,
    CreditCard
} from 'lucide-react';
import { translations } from '../translations';

interface SettingsViewProps {
    businessName: string;
    setBusinessName: (name: string) => void;
    location: string;
    setLocation: (loc: string) => void;
    brandColor: string;
    setBrandColor: (color: string) => void;
    lang: 'es' | 'en';
    setLang: (lang: 'es' | 'en') => void;
    scriptUrl: string;
    setScriptUrl: (url: string) => void;
    onSync: () => Promise<void>;
    onSaveProfile: () => Promise<boolean>;
    onNavigate: (view: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
    businessName,
    setBusinessName,
    location,
    setLocation,
    brandColor,
    setBrandColor,
    lang,
    setLang,
    scriptUrl,
    setScriptUrl,
    onSync,
    onSaveProfile,
    onNavigate
}) => {
    const t = translations[lang];
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const success = await onSaveProfile();
            if (success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: brandColor + '20' }}
                >
                    <Settings size={24} style={{ color: brandColor }} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">{t.settings}</h1>
                    <p className="text-zinc-400 text-sm">Personaliza tu plataforma y sincronización</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Profile */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-2 text-white font-semibold border-b border-zinc-800 pb-4">
                        <Building2 size={20} style={{ color: brandColor }} />
                        PERFIL DEL NEGOCIO
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-zinc-400 text-sm mb-2">Nombre de la Agencia</label>
                            <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': brandColor } as any}
                            />
                        </div>

                        <div>
                            <label className="block text-zinc-400 text-sm mb-2">Ubicación / Ciudad</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2"
                                style={{ '--tw-ring-color': brandColor } as any}
                            />
                        </div>
                    </div>
                </div>

                {/* Branding & Language */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-2 text-white font-semibold border-b border-zinc-800 pb-4">
                        <Palette size={20} style={{ color: brandColor }} />
                        PERSONALIZACIÓN
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-zinc-400 text-sm mb-2">Color de Marca</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={brandColor}
                                    onChange={(e) => setBrandColor(e.target.value)}
                                    className="w-12 h-12 bg-transparent border-none cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={brandColor}
                                    onChange={(e) => setBrandColor(e.target.value)}
                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-zinc-400 text-sm mb-2">Idioma de la Plataforma</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLang('es')}
                                    className={`flex-1 py-3 rounded-xl border transition-all ${lang === 'es' ? 'bg-zinc-800 border-zinc-600 text-white' : 'border-zinc-800 text-zinc-500'}`}
                                    style={lang === 'es' ? { borderColor: brandColor } : {}}
                                >
                                    Español
                                </button>
                                <button
                                    onClick={() => setLang('en')}
                                    className={`flex-1 py-3 rounded-xl border transition-all ${lang === 'en' ? 'bg-zinc-800 border-zinc-600 text-white' : 'border-zinc-800 text-zinc-500'}`}
                                    style={lang === 'en' ? { borderColor: brandColor } : {}}
                                >
                                    English
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cloud Sync */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 lg:col-span-2">
                    <div className="flex items-center gap-2 text-white font-semibold border-b border-zinc-800 pb-4">
                        <Database size={20} style={{ color: brandColor }} />
                        CONEXIÓN CON GOOGLE SHEETS
                    </div>

                    <div className="space-y-4">
                        <p className="text-zinc-500 text-sm">
                            Ingresa la URL del script de Google Apps Script para habilitar el respaldo automático en la nube.
                        </p>
                        <div className="flex flex-col lg:flex-row gap-3">
                            <input
                                type="text"
                                value={scriptUrl}
                                onChange={(e) => setScriptUrl(e.target.value)}
                                placeholder="https://script.google.com/macros/s/.../exec"
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white font-mono text-sm"
                            />
                            <button
                                onClick={() => onSync()}
                                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white flex items-center justify-center gap-2 transition-all"
                            >
                                <RefreshCw size={18} />
                                Probar Conexión
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resources & Billing */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-2 text-white font-semibold border-b border-zinc-800 pb-4">
                    <CreditCard size={20} style={{ color: brandColor }} />
                    {lang === 'es' ? 'RECURSOS & SUSCRIPCIÓN' : 'RESOURCES & BILLING'}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => window.open('docs/index.html', '_blank')}
                        className="flex items-center justify-between p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <ExternalLink size={20} />
                            </div>
                            <div className="text-left">
                                <span className="block text-white font-bold text-sm">
                                    {lang === 'es' ? 'Ver Documentación' : 'View Documentation'}
                                </span>
                                <span className="block text-zinc-500 text-xs">
                                    {lang === 'es' ? 'Manuales y Guías' : 'Manuals & Guides'}
                                </span>
                            </div>
                        </div>
                        <ExternalLink size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                    </button>

                    <button
                        onClick={() => onNavigate('billing')}
                        className="flex items-center justify-between p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <CreditCard size={20} />
                            </div>
                            <div className="text-left">
                                <span className="block text-white font-bold text-sm">
                                    {lang === 'es' ? 'Gestionar Plan' : 'Manage Subscription'}
                                </span>
                                <span className="block text-zinc-500 text-xs">
                                    {lang === 'es' ? 'Facturación y Upgrades' : 'Billing & Upgrades'}
                                </span>
                            </div>
                        </div>
                        <ExternalLink size={16} className="text-zinc-500 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 w-full">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: brandColor, color: '#000' }}
                >
                    {isSaving ? (
                        <RefreshCw size={24} className="animate-spin" />
                    ) : saveSuccess ? (
                        <CheckCircle size={24} />
                    ) : (
                        <Save size={24} />
                    )}
                    {saveSuccess ? 'Configuración Guardada' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );
};

export default SettingsView;
