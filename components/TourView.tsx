
import React, { useState } from 'react';
import {
    RotateCw,
    Eye,
    Smartphone,
    Box,
    ExternalLink,
    Plus,
    Play,
    Layers,
    Search,
    Maximize2,
    Trash2,
    Share2,
    X,
    Loader2,
    CheckCircle
} from 'lucide-react';
import { Property } from '../types';
import { translations } from '../translations';

interface TourViewProps {
    properties: Property[];
    lang: 'es' | 'en';
    brandColor: string;
    onUpdateProperty?: (property: Property) => Promise<Property | null>;
}

declare global {
    interface Window {
        pannellum: any;
    }
}
const TourView: React.FC<TourViewProps> = ({
    properties,
    lang,
    brandColor,
    onUpdateProperty
}) => {
    // Helper to estimate if an image is equirectangular (approx 2:1 aspect ratio)
    // Note: In a real app we'd check dimensions, here we can look for "equirectangular" in the URL
    // or assume properties with 360 in the title/desc are candidates if they have images.
    const isEquirectangular = (url: string) => {
        return url.toLowerCase().includes('360') ||
            url.toLowerCase().includes('equi') ||
            url.toLowerCase().includes('panorama');
    };

    const t = translations[lang];
    const [activeTour, setActiveTour] = useState<Property | null>(null);
    const [viewerStarted, setViewerStarted] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [tourImageUrl, setTourImageUrl] = useState('');
    const [showAllProperties, setShowAllProperties] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const viewerRef = React.useRef<HTMLDivElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (viewerStarted && activeTour?.virtualTourUrl && viewerRef.current) {
            setIsLoading(true);
            const startTime = Date.now();
            const timer = setTimeout(() => {
                if (window.pannellum) {
                    const viewer = window.pannellum.viewer(viewerRef.current, {
                        type: 'equirectangular',
                        panorama: activeTour.virtualTourUrl,
                        autoLoad: true,
                        showControls: true
                    });

                    // Listen for load event
                    viewer.on('load', () => {
                        // Ensure loading indicator shows for at least 800ms
                        const elapsed = Date.now() - startTime;
                        const remaining = Math.max(0, 800 - elapsed);
                        setTimeout(() => {
                            setIsLoading(false);
                        }, remaining);
                    });

                    // Handle errors
                    viewer.on('error', () => {
                        setIsLoading(false);
                        console.error('Error loading 360 tour');
                    });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [viewerStarted, activeTour]);

    const handleCreateTour = async () => {
        if (!selectedPropertyId || !tourImageUrl) return;
        setIsSaving(true);
        try {
            const property = properties.find(p => p.id === selectedPropertyId);
            if (property && onUpdateProperty) {
                await onUpdateProperty({
                    ...property,
                    virtualTourUrl: tourImageUrl
                });
                setShowCreateModal(false);
                setSelectedPropertyId('');
                setTourImageUrl('');
            }
        } catch (error) {
            console.error('Error creating tour:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        if (!activeTour) return;
        const shareUrl = `${window.location.origin}/public/property/${activeTour.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert(lang === 'es' ? '¡Enlace copiado al portapapeles!' : 'Link copied to clipboard!');
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleFullscreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => {
                console.error('Error entering fullscreen:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    };

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                        {lang === 'es' ? 'TOURS' : 'VIRTUAL'} <br />
                        <span style={{ color: brandColor }}>{lang === 'es' ? 'VIRTUALES 360°' : '360° TOURS'}</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-2">{lang === 'es' ? 'Experiencias inmersivas para tus clientes' : 'Immersive experiences for your clients'}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ backgroundColor: brandColor }}
                    className="flex items-center gap-2 px-6 py-3 text-black rounded-xl transition-all font-black text-xs uppercase italic active:scale-95 shadow-lg shadow-amber-500/20"
                >
                    <Plus size={18} />
                    {lang === 'es' ? 'Crear Nuevo Tour' : 'Create New Tour'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Active Tour Viewer */}
                <div className="lg:col-span-8 space-y-6">
                    <div ref={containerRef} className="aspect-video bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden relative group shadow-2xl">
                        {activeTour ? (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity p-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest italic">{lang === 'es' ? 'VIVO' : 'LIVE'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleShare}
                                                className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-white/10 transition-all"
                                            >
                                                <Share2 size={18} />
                                            </button>
                                            <button
                                                onClick={handleFullscreen}
                                                className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-white/10 transition-all"
                                            >
                                                <Maximize2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {viewerStarted && activeTour.virtualTourUrl ? (
                                    <>
                                        <div ref={viewerRef} className="absolute inset-0 z-20" />
                                        {isLoading && (
                                            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center">
                                                <div className="text-center space-y-4">
                                                    <div className="relative">
                                                        <Loader2 className="text-amber-500 animate-spin" size={48} />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-8 h-8 border-2 border-amber-500/20 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-white font-black text-sm uppercase italic tracking-wider">
                                                            {lang === 'es' ? 'Cargando Experiencia 360°' : 'Loading 360° Experience'}
                                                        </p>
                                                        <p className="text-zinc-400 text-xs font-bold italic">
                                                            {lang === 'es' ? 'Preparando vista inmersiva...' : 'Preparing immersive view...'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <img src={activeTour.images[0]} className="w-full h-full object-cover blur-[2px] opacity-40 scale-110" alt="" />
                                        <div className="absolute inset-0 bg-[#000]/20 backdrop-blur-[1px]"></div>
                                        <div className="relative text-center space-y-6">
                                            <div className="w-24 h-24 bg-white/5 border border-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-xl animate-pulse">
                                                <RotateCw className="text-white" size={40} />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{activeTour.title}</h3>
                                                <p className="text-zinc-400 text-xs font-bold italic">{lang === 'es' ? 'Vista: Estancia Principal' : 'View: Main Living Room'}</p>
                                            </div>
                                            {activeTour.virtualTourUrl ? (
                                                <button
                                                    onClick={() => setViewerStarted(true)}
                                                    className="px-8 py-3 bg-white text-black rounded-xl font-black text-xs uppercase italic hover:bg-zinc-200 transition-all"
                                                >
                                                    {lang === 'es' ? 'Iniciar Recorrido' : 'Start Tour'}
                                                </button>
                                            ) : (
                                                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl max-w-xs mx-auto">
                                                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest leading-normal">
                                                        {lang === 'es' ? 'Esta propiedad aún no tiene un tour 360 habilitado.' : 'This property does not have a 360 tour yet.'}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {/* Hotspots Simulation */}
                                <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-ping"></div>
                                <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-ping delay-500"></div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-6">
                                <div className="w-24 h-24 bg-zinc-800 rounded-3xl flex items-center justify-center border border-zinc-700">
                                    <Box className="text-zinc-600" size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-zinc-400 uppercase italic tracking-tighter">{lang === 'es' ? 'Selecciona un Tour' : 'Select a Tour'}</h3>
                                    <p className="text-zinc-600 text-sm max-w-sm">{lang === 'es' ? 'Elige una propiedad para cargar su experiencia inmersiva de 360 grados.' : 'Choose a property to load its 360-degree immersive experience.'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
                            <Eye className="text-amber-500" size={20} />
                            <div>
                                <p className="text-[8px] text-zinc-500 font-black uppercase">{lang === 'es' ? 'Vistas' : 'Views'}</p>
                                <p className="text-sm font-black text-white italic">1.2k</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
                            <Smartphone className="text-blue-500" size={20} />
                            <div>
                                <p className="text-[8px] text-zinc-500 font-black uppercase">{lang === 'es' ? 'VR Ready' : 'VR Ready'}</p>
                                <p className="text-sm font-black text-white italic">Compatible</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
                            <Layers className="text-green-500" size={20} />
                            <div>
                                <p className="text-[8px] text-zinc-500 font-black uppercase">{lang === 'es' ? 'Escenas' : 'Scenes'}</p>
                                <p className="text-sm font-black text-white italic">8 {lang === 'es' ? 'Fijos' : 'Points'}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center gap-3">
                            <RotateCw className="text-purple-500" size={20} />
                            <div>
                                <p className="text-[8px] text-zinc-500 font-black uppercase">{lang === 'es' ? 'Giro' : 'Rotation'}</p>
                                <p className="text-sm font-black text-white italic">Full 360</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Selector */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                            <input
                                type="text"
                                placeholder={lang === 'es' ? 'Filtrar tours...' : 'Filter tours...'}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all italic font-bold"
                            />
                        </div>
                    </div>

                    <div
                        onClick={() => setShowAllProperties(!showAllProperties)}
                        className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-800 transition-all group"
                    >
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${showAllProperties ? 'bg-zinc-600' : 'bg-green-500 animate-pulse'}`}></div>
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                                {showAllProperties
                                    ? (lang === 'es' ? 'Viendo Todas' : 'Showing All')
                                    : (lang === 'es' ? 'Filtro: Listas para 360' : 'Filter: 360 Ready')}
                            </span>
                        </div>
                        <span className="text-[8px] text-zinc-600 font-bold uppercase group-hover:text-amber-500 transition-all">
                            {lang === 'es' ? 'Cambiar' : 'Toggle'}
                        </span>
                    </div>

                    <div className="space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
                        {properties
                            .filter(p => {
                                if (showAllProperties) return true;
                                if (p.virtualTourUrl) return true;
                                // Filter properties that have at least one "360-looking" image
                                return p.images && p.images.some(img => isEquirectangular(img));
                            })
                            .map(p => (
                                <div
                                    key={p.id}
                                    className={`group relative rounded-2xl border transition-all cursor-pointer overflow-hidden ${activeTour?.id === p.id ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-zinc-800 hover:border-zinc-700'}`}
                                    onClick={() => {
                                        setActiveTour(p);
                                        setViewerStarted(false);
                                    }}
                                >
                                    <div className="aspect-video relative">
                                        <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play className="text-white fill-white" size={32} />
                                        </div>
                                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[8px] font-black text-white uppercase italic">
                                            360 VR
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zinc-900">
                                        <h4 className="text-xs font-black text-white uppercase italic tracking-tighter truncate">{p.title}</h4>
                                        <p className="text-[10px] text-zinc-500 font-bold italic mt-1">{p.address.city}, {p.address.colony}</p>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* Modal Crear Nuevo Tour */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                                <RotateCw className="text-amber-500" size={24} />
                                {lang === 'es' ? 'CREAR NUEVO TOUR 360' : 'CREATE NEW 360 TOUR'}
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{lang === 'es' ? 'Selecciona Propiedad' : 'Select Property'}</label>
                                <select
                                    value={selectedPropertyId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        console.log('Inmueble seleccionado ID:', val);
                                        setSelectedPropertyId(val);
                                        setTourImageUrl('');
                                    }}
                                    className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                                >
                                    <option value="">{lang === 'es' ? 'Elija una propiedad...' : 'Choose a property...'}</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedPropertyId && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                        {lang === 'es' ? 'Selecciona de la Galería' : 'Select from Gallery'}
                                    </label>
                                    <div className="grid grid-cols-4 gap-2 bg-black/50 p-3 rounded-xl border border-zinc-800 max-h-48 overflow-y-auto custom-scrollbar">
                                        {properties.find(p => String(p.id) === String(selectedPropertyId))?.images.map((img, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => {
                                                    console.log('Imagen 360 seleccionada:', img);
                                                    setTourImageUrl(img);
                                                }}
                                                className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative group ${tourImageUrl === img ? 'border-amber-500 scale-95' : 'border-zinc-800 hover:border-zinc-600'}`}
                                            >
                                                <img src={img} className="w-full h-full object-cover" alt="" />
                                                {tourImageUrl === img && (
                                                    <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                                                        <CheckCircle className="text-white drop-shadow-lg" size={20} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-[8px] text-white font-black uppercase tracking-tighter shadow-sm">{lang === 'es' ? 'USAR' : 'USE'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{lang === 'es' ? 'URL de Imagen 360 (Equirectangular)' : '360 Image URL (Equirectangular)'}</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={tourImageUrl}
                                    onChange={(e) => setTourImageUrl(e.target.value)}
                                    className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all"
                                />
                                <p className="text-[9px] text-zinc-600 font-bold italic leading-tight">
                                    {lang === 'es'
                                        ? 'Para mejores resultados, usa una imagen en formato equirectangular (proporción 2:1).'
                                        : 'For best results, use an equirectangular image (2:1 ratio).'}
                                </p>
                            </div>

                            <button
                                onClick={handleCreateTour}
                                disabled={!selectedPropertyId || !tourImageUrl || isSaving}
                                style={{ backgroundColor: brandColor }}
                                className="w-full py-4 text-black rounded-xl font-black text-sm uppercase italic shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                {lang === 'es' ? 'Generar Experiencia 360' : 'Generate 360 Experience'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TourView;
