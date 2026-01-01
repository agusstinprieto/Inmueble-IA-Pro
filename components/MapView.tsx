
import React, { useState, useEffect, useRef } from 'react';
import {
    Map as MapIcon,
    MapPin,
    Search,
    Layers,
    Navigation,
    Maximize2,
    Minimize2,
    Filter,
    Info,
    Home,
    DollarSign,
    ArrowRight,
    X
} from 'lucide-react';
import { Property, OperationType } from '../types';
import { translations } from '../translations';

interface MapViewProps {
    properties: Property[];
    lang: 'es' | 'en';
    brandColor: string;
}

// Declaración para TypeScript ya que Leaflet se carga vía CDN
declare const L: any;

const MapView: React.FC<MapViewProps> = ({
    properties,
    lang,
    brandColor
}) => {
    const t = translations[lang];
    const [selectedProp, setSelectedProp] = useState<Property | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(lang === 'es' ? 'es-MX' : 'en-US', {
            style: 'currency',
            currency: lang === 'es' ? 'MXN' : 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Inicializar Mapa
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        // Centro por defecto: Torreón, Coah.
        const defaultCenter = [25.5439, -103.4190];

        mapInstance.current = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView(defaultCenter, 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(mapInstance.current);

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Actualizar Marcadores
    useEffect(() => {
        if (!mapInstance.current) return;

        // Limpiar marcadores previos
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        properties.forEach((p, idx) => {
            // Si no hay coordenadas, generamos unas cerca del centro para visualización
            const lat = p.coordinates?.lat || 25.5439 + (Math.random() - 0.5) * 0.05;
            const lng = p.coordinates?.lng || -103.4190 + (Math.random() - 0.5) * 0.05;

            const customIcon = L.divIcon({
                className: 'custom-map-marker',
                html: `
                    <div class="marker-container" style="background-color: ${brandColor}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            });

            const marker = L.marker([lat, lng], { icon: customIcon })
                .addTo(mapInstance.current)
                .on('click', () => setSelectedProp(p));

            markersRef.current.push(marker);
        });

        // Ajustar vista si hay propiedades
        if (properties.length > 0) {
            const group = L.featureGroup(markersRef.current);
            mapInstance.current.fitBounds(group.getBounds().pad(0.1));
        }
    }, [properties, brandColor]);

    return (
        <div className="h-[calc(100vh-100px)] relative overflow-hidden bg-[#0a0a0a]">
            {/* Map Container */}
            <div ref={mapRef} className="absolute inset-0 z-0" />

            {/* Overlays (Keep original UI) */}
            <div className="absolute top-6 left-6 z-20 w-80 space-y-4">
                <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex items-center gap-2 pr-4">
                    <div className="p-2 bg-amber-500 rounded-xl text-black">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder={lang === 'es' ? 'Buscar zona o colonia...' : 'Search area...'}
                        className="bg-transparent border-none text-sm text-white focus:outline-none w-full font-bold placeholder:text-zinc-600"
                    />
                </div>

                <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest italic">{lang === 'es' ? 'Propiedades Cerca' : 'Properties Nearby'}</h3>
                        <span className="text-[10px] font-black text-amber-500 italic bg-amber-500/10 px-2 py-0.5 rounded-full">{properties.length}</span>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {properties.map(p => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setSelectedProp(p);
                                    if (p.coordinates) {
                                        mapInstance.current.setView([p.coordinates.lat, p.coordinates.lng], 16);
                                    }
                                }}
                                className={`w-full p-3 rounded-2xl border transition-all text-left flex gap-3 ${selectedProp?.id === p.id ? 'bg-amber-500/20 border-amber-500' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                            >
                                <img src={p.images[0]} className="w-12 h-12 rounded-xl object-cover" alt="" />
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-white uppercase italic truncate tracking-tighter">{p.title}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold mt-1 italic">{formatCurrency(p.operation === OperationType.VENTA ? p.salePrice || 0 : p.rentPrice || 0)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-6 right-6 z-20 flex flex-col gap-3">
                <div className="flex flex-col bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                    <button onClick={() => mapInstance.current.zoomIn()} className="p-3 text-white hover:bg-zinc-800 transition-all border-b border-white/10"><Maximize2 size={18} /></button>
                    <button onClick={() => mapInstance.current.zoomOut()} className="p-3 text-white hover:bg-zinc-800 transition-all"><Minimize2 size={18} /></button>
                </div>
                <button
                    onClick={() => {
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                                mapInstance.current.setView([pos.coords.latitude, pos.coords.longitude], 15);
                            });
                        }
                    }}
                    className="p-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-zinc-800 transition-all shadow-xl"
                >
                    <Navigation size={20} />
                </button>
            </div>

            {/* Selected Property Card */}
            {selectedProp && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-[400px] px-4 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
                        <button
                            onClick={() => setSelectedProp(null)}
                            className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex gap-6">
                            <img src={selectedProp.images[0]} className="w-32 h-32 rounded-3xl object-cover shadow-2xl" alt="" />
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic">{selectedProp.type} • {selectedProp.operation}</span>
                                    <h4 className="text-xl font-black text-white uppercase italic tracking-tighter truncate">{selectedProp.title}</h4>
                                    <p className="text-xs text-zinc-500 font-bold italic flex items-center gap-1">
                                        <MapPin size={12} className="text-amber-500" />
                                        {selectedProp.address.city}, {selectedProp.address.colony}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-xl font-black text-white italic tracking-tighter">
                                        {formatCurrency(selectedProp.operation === OperationType.VENTA ? selectedProp.salePrice || 0 : selectedProp.rentPrice || 0)}
                                    </p>
                                    <button
                                        style={{ backgroundColor: brandColor }}
                                        className="p-2.5 text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Styles for Leaflet */}
            <style>{`
                .custom-map-marker .marker-container {
                    width: 32px;
                    height: 32px;
                    border-radius: 12px 12px 12px 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: black;
                    border: 2px solid white;
                    transform: rotate(-45deg);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                }
                .custom-map-marker .marker-container svg {
                    transform: rotate(45deg);
                }
                .leaflet-container {
                    background: #0a0a0a !important;
                }
            `}</style>
        </div>
    );
};

export default MapView;
